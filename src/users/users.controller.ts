import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { PrismaService } from "src/prisma/prisma.service";
@Controller("users")
export class UsersController {
  constructor(
    private userService: UsersService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    const [followerCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: {
          followingId: req.user.userId, 
        },
      }),
      this.prisma.follow.count({
        where: {
          followerId: req.user.userId, 
        },
      }),
    ]);
    return {
      message: "UserProfile fetched successfully",
      user: {
        id: user!.id,
        username: user!.username,
        email: user!.email,
        bio: user!.bio,
        avatarUrl: user!.avatarUrl,
        coverUrl: user!.coverUrl,
        createdAt: user!.createdAt,
        followerCount,
        followingCount,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("search")
  async searchUser(@Query("query") query: string) {
    const result = await this.userService.searchUsers(query);
    return { result };
  }

  @UseGuards(JwtAuthGuard)
  @Get("followers")
  async getFollowers(@Request() req) {
    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: req.user.userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return {
      followers: followers.map(f => f.follower),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("following")
  async getFollowing(@Request() req) {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: req.user.userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return {
      following: following.map(f => f.following),
    };
  }

  @Get(":id")
  async getUserById(@Param("id") id: string) {
    const user = await this.userService.findById(id);
     const [followerCount, followingCount] = await Promise.all([
    this.prisma.follow.count({
      where: {
        followingId: id, 
      },
    }),
    this.prisma.follow.count({
      where: {
        followerId: id, 
      },
    }),
  ]);
    if (!user) {
      return { Message: "User not found" };
    }
    return {
      message: "User fetched successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        followerCount,
        followingCount,
      },
    };
  }
}
