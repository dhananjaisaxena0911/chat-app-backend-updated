export class CreateGroupDto1{
    name:string;
    description?:string;
}
export class joinGroupDto{
    userId:string;
    groupId:string;
}
export class SendGroupMessageDto{
    groupId:string;
    senderId:string;
    content:string;
}