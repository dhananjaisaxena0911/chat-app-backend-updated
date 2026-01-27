import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ChatGateway } from "src/chat/chat.gateway";

@Injectable()
export class GroupMessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async sendGroupMessage(senderId: string, groupId: string, content: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: senderId,
      },
    });

    console.log("Found user:", user);

    const message = await this.prisma.groupMessage.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        group: { connect: { id: groupId } },
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

    // Return formatted message to match frontend interface
    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: user?.username || "Unknown",
      groupId: message.groupId,
      content: message.content,
      createdAt: message.timeStamp.toISOString(),
      status: message.status,
      reaction: [],
    };

    // Emit the new message event
    this.chatGateway.server.to(groupId).emit("newGroupMessage", formattedMessage);

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

    // Return formatted messages
    return messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.username,
      groupId: msg.groupId,
      content: msg.content,
      createdAt: msg.timeStamp.toISOString(),
      status: msg.status,
      reaction: msg.reactions.map(r => ({ userId: r.userId, emoji: r.emoji })),
    }));
  }
}

