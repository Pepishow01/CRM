import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'vendedor@agencia.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mi_password_seguro' })
  @IsString()
  @MinLength(8)
  password: string;
}