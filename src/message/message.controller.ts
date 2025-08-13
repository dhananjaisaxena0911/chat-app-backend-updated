import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { MessageService } from "./message.service";

@Controller("message")
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async sendMessage(
    @Body() body:{
      senderId:string,
      recipientId:string,
      content:string
    },
  ) {
    console.log("Recieved message body:",body)
    return this.messageService.sendMessage(
      body.senderId,
      body.recipientId,
      body.content,
    );
  }

  @Get(":conversationId")
  async getMessageForConversation(
    @Param("conversationId") conversationId: string,
  ) {
    return this.messageService.getMessageForConversation(conversationId);
  }
}
