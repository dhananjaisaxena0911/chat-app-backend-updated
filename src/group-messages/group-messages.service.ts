import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class GroupMessagesService {
  constructor(private prisma: PrismaService) {}
  async sendGroupMessage(senderId: string, groupId: string, content: string) {
    const user= await this.prisma.user.findUnique({
        where:{
            id:senderId
        }
    });
    console.log('Found user:',user);
    return this.prisma.groupMessage.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        group: { connect: { id: groupId } },
      },
      include: {
        sender: true,
      },
    });
  }
}
