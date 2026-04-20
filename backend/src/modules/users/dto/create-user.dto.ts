import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'vendedor@agencia.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Juan Vendedor' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: UserRole, default: UserRole.SELLER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}