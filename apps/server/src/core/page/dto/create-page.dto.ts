import { IsOptional, IsString, IsUUID, IsBoolean, IsDateString } from 'class-validator';

export class CreatePageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  parentPageId?: string;

  @IsUUID()
  spaceId: string;

  @IsOptional()
  @IsBoolean()
  isJournal?: boolean;

  @IsOptional()
  @IsDateString()
  journalDate?: string;
}
