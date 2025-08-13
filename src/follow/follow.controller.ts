import { Controller, Post, Get, Body, Param,Query, BadRequestException } from "@nestjs/common";
import { FollowService } from "./follow.service";
@Controller("follow")
export class FollowController {
  constructor(private readonly followService: FollowService) {}
  @Post()
  async followUser(@Body() body: { followerId: string; followingId: string }) {
    return this.followService.followUser(body.followerId, body.followingId);
  }

  @Post("unfollow")
  async unfollowUser(
    @Body() body: { followerId: string; followingId: string },
  ) {
    return this.followService.unfollowUser(body.followerId, body.followingId);
  }

  @Get("isFollowing")
async isFollowing(@Query() query: { followerId: string; followingId: string }) {
  const { followerId, followingId } = query;

  if (!followerId || !followingId) {
    throw new BadRequestException("Missing followerId or followingId");
  }

  const isFollowing = await this.followService.isFollowing(followerId, followingId);
  return { isFollowing };
}


  @Get("followers/:userId")
  async getFollowers(@Param("userId") userId: string) {
    return this.followService.getFollowers(userId);
  }
  @Get("following/:userId")
  async getFollowing(@Param("userId") userId: string) {
    return this.followService.getFollowing(userId);
  }
}
