import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { S3Service } from "src/s3/s3.service";

@Injectable()
export class StoryService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async createStoryWithFile(userId: string, file: Express.Multer.File) {
    // Upload file to S3
    const imageUrl = await this.s3Service.uploadFile(file, 'stories');
    
    return this.prisma.story.create({
      data: {
        imageUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async createStory(userId: string, imageUrl: string) {
    return this.prisma.story.create({
      data: {
        imageUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async getActiveStories(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    let stories;
    if (followingIds.length === 0) {
      stories = await this.prisma.story.findMany({
        where: {
          userId: userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      stories = await this.prisma.story.findMany({
        where: {
          OR: [
            {
              userId: userId,
              expiresAt: {
                gt: new Date(),
              },
            },
            {
              userId: {
                in: followingIds,
              },
              expiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
        include: { user: true },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Generate signed URLs for all story images
    const storiesWithSignedUrls = await Promise.all(
      stories.map(async (story) => ({
        ...story,
        imageUrl: story.imageUrl 
          ? await this.s3Service.getSignedDownloadUrl(story.imageUrl)
          : null,
      }))
    );

    return storiesWithSignedUrls;
  }
}
