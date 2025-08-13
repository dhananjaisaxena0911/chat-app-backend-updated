import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import { GroupService } from "./group.service";
import { joinGroupDto, SendGroupMessageDto } from "./dto/group.dto";

import {
  CreateGroupDto,
  AddMemberDto,
  RemoveMemberDto,
  RenameGroupDto,
} from "./dto/create-group.dto";
import { GroupResponseDto } from "./dto/group-Response.dto";

@Controller("group")
export class GroupController {
  constructor(private readonly groupService: GroupService) {}
  @Post()
  createGroup(@Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(dto);
  }

  @Post("add-member")
  addMember(@Body() dto: AddMemberDto) {
    return this.groupService.addMember(dto);
  }
  @Post("remove-member")
  removeMember(@Body() dto: RemoveMemberDto) {
    return this.groupService.removeMember(dto);
  }
  @Put("rename")
  renameGroup(@Body() dto: RenameGroupDto) {
    return this.groupService.renameGroup(dto);
  }
  @Delete("leave")
  leaveGroup(@Body() body: { groupId: string; userId: string }) {
    return this.groupService.leaveGroup(body.groupId, body.userId);
  }
  @Delete("delete")
  deleteGroup(@Body() body: { groupId: string; adminId: string }) {
    return this.groupService.deleteGroup(body.groupId, body.adminId);
  }
  @Get()
  getAllGroups():Promise<GroupResponseDto[]>{
    return this.groupService.getAllGroups();
  }
  @Post("join")
  joinGroup(@Body() dto: joinGroupDto) {
    return this.groupService.joinGroup(dto);
  }

  @Post("message")
  sendMessage(@Body() dto: SendGroupMessageDto) {
    return this.groupService.sendMessage(dto);
  }
  @Get(":groupId/messages")
  getGroupMessages(@Param("groupId") groupId: string) {
    return this.groupService.getGroupMessages(groupId);
  }
}
