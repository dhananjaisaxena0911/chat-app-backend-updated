import { Body, Controller, Get, Param, Post, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StoryService } from "./story.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("story")
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor('file'))
  uploadStory(
    @Body() body: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }
    
    console.log("Upload body", body);
    console.log("File uploaded:", file.originalname);
    
    return this.storyService.createStoryWithFile(body.userId, file);
  }

  private isValidUrl(url: string): boolean {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  @Get("active/:userId")
  getActiveStories(@Param("userId") userId: string) {
    return this.storyService.getActiveStories(userId);
  }
}
