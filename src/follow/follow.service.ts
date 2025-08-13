import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error("Cant follow yourself");

    return this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }
  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }
  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: true,
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: true,
      },
    });
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });
    return !!follow;
  }
}
