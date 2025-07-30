import { IsOptional, IsString, IsDateString, IsUUID, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';

export class CreateJournalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsDateString()
  journalDate: string;

  @IsUUID()
  spaceId: string;
}

export class JournalByDateDto {
  @IsDateString()
  journalDate: string;

  @IsUUID()
  spaceId: string;

  @IsOptional()
  includeContent?: boolean;
}

export class JournalListDto extends PaginationOptions {
  @IsUUID()
  spaceId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeContent?: boolean;
}

export class UpdateJournalDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsDateString()
  journalDate?: string;
}