import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateGroupDto1,
  joinGroupDto,
  SendGroupMessageDto,
} from "./dto/group.dto";
import { ChatGateway } from "src/chat/chat.gateway";
import {
  AddMemberDto,
  CreateGroupDto,
  RemoveMemberDto,
  RenameGroupDto,
} from "./dto/create-group.dto";
import { connect } from "http2";

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async createGroup(dto: CreateGroupDto) {
    const { name, adminId, membersIds } = dto;

    // Filter out adminId from membersIds to avoid duplicate entry
    const uniqueMembers = membersIds?.filter(id => id !== adminId) || [];

    const group = await this.prisma.group.create({
      data: {
        name,
        admin: {
          connect: {
            id: adminId,
          },
        },
        members: {
          create:
            uniqueMembers.map((id) => ({
              userId: id,
            })) || [],
        },
      },
      include: {
        members: true,
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Add admin as member if not already included
    const isAdminMember = group.members.some(m => m.userId === adminId);
    if (!isAdminMember) {
      await this.prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: adminId,
        },
      });
    }

    return group;
  }

  async getAllGroups() {
    return this.prisma.group.findMany({
      include: {
        members: true,
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                
              },
            },
          },
        },
        admin:{
          select:{
            id:true,
            username:true,
          }
        },
      },
    });
  }

  async joinGroup(dto: joinGroupDto) {
    const existing = await this.prisma.groupMember.findFirst({
      where: {
        userId: dto.userId,
        groupId: dto.groupId,
      },
    });

    if (existing) {
      throw new ConflictException("User is already a member of this group");
    }
    return this.prisma.groupMember.create({
      data: {
        userId: dto.userId,
        groupId: dto.groupId,
      },
    });
  }


  async sendMessage(dto: SendGroupMessageDto) {
    const isMember = await this.prisma.groupMember.findFirst({
      where: {
        userId: dto.senderId,
        groupId: dto.groupId,
      },
    });
    if (!isMember) {
      throw new ForbiddenException("User is not a member of the group");
    }
    
    // Get sender username
    const sender = await this.prisma.user.findUnique({
      where: { id: dto.senderId },
      select: { username: true },
    });

    const message = await this.prisma.groupMessage.create({
      data: {
        content: dto.content,
        groupId: dto.groupId,
        senderId: dto.senderId,
        status: "sent",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emit the new message event with complete data
    const formattedMessage = {
      id: message.id,
      groupId: message.groupId,
      content: message.content,
      createdAt: message.timeStamp.toISOString(),
      senderId: message.senderId,
      senderName: sender?.username || "Unknown",
      status: message.status,
      reaction: [],
    };
    
    this.chatGateway.server.to(dto.groupId).emit("newGroupMessage", formattedMessage);

    return formattedMessage;
  }

  async getGroupMessages(groupId: string) {
    const messages = await this.prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { timeStamp: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        reactions: {
          select: {
            userId: true,
            emoji: true,
          },
        },
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      groupId: msg.groupId,
      content: msg.content,
      createdAt: msg.timeStamp.toISOString(),
      senderId: msg.sender.id,
      senderName: msg.sender.username,
      status: msg.status,
      reaction: msg.reactions.map(r => ({ userId: r.userId, emoji: r.emoji })),
    }));
  }

  async getGroupMembers(groupId: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      members: members.map(m => ({
        id: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        joinedAt: m.joinedAt,
      })),
    };
  }
  async addMember(dto: AddMemberDto) {
    return this.prisma.groupMember.create({
      data: {
        groupId: dto.groupId,
        userId: dto.userId,
      },
    });
  }

  async removeMember(dto: RemoveMemberDto) {
    return this.prisma.groupMember.deleteMany({
      where: {
        groupId: dto.groupId,
        userId: dto.userId,
      },
    });
  }

  async renameGroup(dto: RenameGroupDto) {
    return this.prisma.group.update({
      where: {
        id: dto.groupId,
      },
      data: {
        name: dto.newName,
      },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    return this.removeMember({ groupId, userId });
  }

  async deleteGroup(groupId: string, adminId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    if (group.adminId !== adminId) {
      throw new ForbiddenException("Only the admin can delete this group");
    }

    await this.prisma.groupMember.deleteMany({ where: { groupId } });
    await this.prisma.groupMessage.deleteMany({ where: { groupId } });
    return this.prisma.group.delete({ where: { id: groupId } });
  }
}
