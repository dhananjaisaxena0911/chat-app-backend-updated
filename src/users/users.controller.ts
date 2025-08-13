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
    return {
      message: "UserProfile fetched successfully",
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("search")
  async searchUser(@Query("query") query: string) {
    const result = await this.userService.searchUsers(query);
    return { result };
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
