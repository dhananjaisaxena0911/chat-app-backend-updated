import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateConversationDto } from "./create-converation.dto";

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async createConversation(
    participantIds: string[],
    isGroup = false,
    name?: string,
  ) {
    
    try {
      const user= await this.prisma.user.findMany({
        where:{id:{in:participantIds}},
      });
      if(user.length!==participantIds.length){
        console.log(participantIds);
        throw new Error("One or more Participants id present ,Invalid participant id");
      }
      return this.prisma.conversation.create({
      data: {
        isGroup,
        name,
        participants: {
          connect: participantIds.map((id) => ({
            id,
          })),
        },
      },
    });
    } catch (error) {
      console.error("Error creating conversation",error);
      throw error;
    }
  }

  async findUserConversation(userId: string) {
    const conversation = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
          },
        },
      },
    });
    return conversation.map((convo) => ({
      id: convo.id,
      participants: convo.participants,
      lastMessage: convo.messages[0]?.content || null,
      updatedAt: convo.messages[0]?.createdAt,
    }));
  }
  // return this.prisma.conversation.findMany({
  //   where: {
  //     participants: {
  //       some: {
  //         id: userId,
  //       },
  //     },
  //   },
  //   include: {
  //     participants: true,
  //     messages: {
  //       orderBy: {
  //         createdAt: "desc",
  //       },
  //       take: 1,
  //     },
  //   },
  // });
  async findUserConversationId(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });
  }
}
