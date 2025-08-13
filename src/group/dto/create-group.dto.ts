export class CreateGroupDto{
    name:string;
    adminId:string;
    membersIds:string[];
}

export class AddMemberDto{
    groupId:string;
    userId:string;
}

export class RemoveMemberDto{
    groupId:string;
    userId:string;
}

export class RenameGroupDto{
    groupId:string;
    newName:string;
}