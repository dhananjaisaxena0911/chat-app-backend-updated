import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ChatGateway } from "src/chat/chat.gateway";
import {
  AddMemberDto,
  RemoveMemberDto,
  RenameGroupDto,
} from "src/group/dto/create-group.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}
  async sendMessage(senderId: string, recipientId: string, content: string) {
    if (!senderId || !recipientId) {
      console.log("Both sender id and Reciepient Id are needed!!");
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!sender || !recipient) {
      throw new Error("Sender or Recipient does not exist");
    }
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: { in: [senderId, recipientId] },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: senderId }, { id: recipientId }],
          },
        },
      });
    }

    const newMessage = await this.prisma.message.create({
      data: {
        content,
        senderId,
        recipientId: recipientId,
        conversationId: conversation.id,
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

    this.chatGateway.server.to(recipientId).emit("new_notification", {
      type: "message",
      from: sender.username,
      message: content,
      conversationId: conversation.id,
    });
    return newMessage;
  }

  async getMessageForConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async saveReaction(data: {
    messageId: string;
    userId: string;
    emoji: string;
  }) {
    console.log(data);
    const messageExists = await this.prisma.groupMessage.findUnique({
      where: { id: data.messageId },
      select: { id: true },
    });
    console.log(data);
    if (!messageExists) {
      throw new Error(`Message with ID ${data.messageId} does not exist`);
    }

    return this.prisma.messageReaction.upsert({
      where: {
        userId_groupMessageId: {
          userId: data.userId,
          groupMessageId: data.messageId,
        },
      },
      update: {
        emoji: data.emoji,
      },
      create: {
        userId: data.userId,
        groupMessageId: data.messageId,
        emoji: data.emoji,
      },
    });
  }

  
}
