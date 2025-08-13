import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { StoryService } from "./story.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("story")
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post("upload")
  uploadStory(@Body() body: { userId:string,imageUrl: string }) {
    console.log("Upload body",body);
    return this.storyService.createStory(body.userId, body.imageUrl);
  }

  @Get("active/:userId")
  getActiveStories(@Param("userId") userId: string) {
    return this.storyService.getActiveStories(userId);
  }
}
