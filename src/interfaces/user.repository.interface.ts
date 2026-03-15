import { User } from "@prisma/client";
import { PaginatedResult, QueryOptions } from "./base.interface";

export type { User };

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface CreateUserInput {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified?: boolean;
  phoneNumber?: string;
  role: Role;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified?: boolean;
  phoneNumber?: string;
  role?: Role;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findOne(filter: Partial<User>): Promise<User | null>;
  findMany(options: QueryOptions): Promise<PaginatedResult<User>>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  softDelete(id: string): Promise<User>;
  count(filters?: Partial<User>): Promise<number>;
}
