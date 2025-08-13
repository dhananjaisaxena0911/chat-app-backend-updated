import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { ConversationService } from "./conversation.service";
@Controller("conversation")
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  createConverstion(
    @Body()
    body: {
      participantsIDs: string[];
      isGroup?: boolean;
      name?: string;
    },
  ) {
    return this.conversationService.createConversation(
      body.participantsIDs,
      body.isGroup,
      body.name,
    );
  }

  @Get(":userId")
  getUserConversation(@Param("userId") userId: string) {
    return this.conversationService.findUserConversation(userId);
  }
  @Get("conversationId/:userId")
  getConversationId(@Param("userId") userId: string) {
    return this.conversationService.findUserConversationId(userId);
  }
}
