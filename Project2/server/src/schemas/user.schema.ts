import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { USER_ROLES } from '../common/roles.decorator';
import type { UserRole } from '../common/roles.decorator';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: String, default: null })
  password: string | null;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'student', enum: USER_ROLES })
  role: UserRole;

  @Prop({ type: String, default: null })
  profileImage: string;

  @Prop({ type: String, default: null })
  refreshToken: string | null;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  emailVerifyToken: string | null;

  @Prop({ type: String, default: null })
  oauthProvider: string | null;

  @Prop({ type: String, default: null })
  oauthId: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
