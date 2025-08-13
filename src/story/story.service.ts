import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

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

    if (followingIds.length === 0) {
      return this.prisma.story.findMany({
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
    }

    return this.prisma.story.findMany({
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
}
