import { IsArray,IsBoolean,IsOptional,IsString } from "class-validator";

export class CreateConversationDto{
    @IsArray()
    @IsString({each:true})
    participantsIds:string[];

    @IsOptional()
    @IsBoolean()
    isGroup:boolean;

    @IsString()
    @IsOptional()
    name?:string;
}