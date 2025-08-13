import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Get,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import { CreateUserDto } from "src/users/dto/create-uset.dto";
import { localAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Response, Request } from "express";

@Controller("auth")
export class AuthController {
  constructor(
    private autHService: AuthService,
    private userService: UsersService,
  ) {}

  @Post("signup")
  async signup(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @UseGuards(localAuthGuard)
  @Post("login")
  async login(@Body() body: any, @Res() res: Response) {
    const user = await this.autHService.validateUser(body.email, body.password);
    const token = await this.autHService.generateToken(user);

    // Set the cookie securely
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });
    return res.json({token,userId:user.id,message:"Login successful"});
  }

  @UseGuards(JwtAuthGuard)
  @Get("check")
  async checkAuth(@Req() req: Request, @Res() res: Response) {
    // If JwtAuthGuard passes, user is authenticated
    return res.status(HttpStatus.OK).json({ authenticated: true });
  }
}
