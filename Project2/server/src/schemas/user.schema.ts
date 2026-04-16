import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { USER_ROLES } from '../common/roles.decorator';
import type { UserRole } from '../common/roles.decorator';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'student', enum: USER_ROLES })
  role: UserRole;

  @Prop({ default: null })
  profileImage: string;

  @Prop({ default: null })
  refreshToken: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
