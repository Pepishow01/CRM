import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}