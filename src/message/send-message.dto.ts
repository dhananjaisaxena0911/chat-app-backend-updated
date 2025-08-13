import { IsString } from "class-validator";

export class SendMessageDto{
    @IsString()
    senderId:string;

    @IsString()
    conversationId:string;

    @IsString()
    content:string;
}