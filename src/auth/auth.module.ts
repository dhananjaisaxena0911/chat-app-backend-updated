import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './loacal.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt-strategy';


@Module({
  imports: [forwardRef(() => UsersModule), PrismaModule, PassportModule,
     JwtModule.register({
       secret: 'defaultSecretKey',
       signOptions: {expiresIn:'1d'},
     }),],
  providers: [AuthService,LocalStrategy,JwtAuthGuard,JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
