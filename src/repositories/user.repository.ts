import { PrismaClient, User } from "@prisma/client";
import {
  IUserRepository,
  CreateUserInput,
  UpdateUserInput,
} from "../interfaces/user.repository.interface";
import { PaginatedResult, QueryOptions } from "../interfaces/base.interface";
import {
  findById,
  findOne,
  findMany,
  createRecord,
  updateRecord,
  softDelete,
  countRecords,
} from "../operations/base.operations";

export class UserRepository implements IUserRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return findById<User>(this.client, "user", id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return findOne<User>(this.client, "user", { email });
  }

  async findOne(filter: Partial<User>): Promise<User | null> {
    return findOne<User>(this.client, "user", filter as unknown as Record<string, unknown>);
  }

  async findMany(options: QueryOptions): Promise<PaginatedResult<User>> {
    return findMany<User>(this.client, "user", {
      ...options,
      searchFields: options.searchFields ?? ["email", "firstName", "lastName"],
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return createRecord<User>(this.client, "user", data as unknown as Record<string, unknown>);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return updateRecord<User>(this.client, "user", id, data as unknown as Record<string, unknown>);
  }

  async softDelete(id: string): Promise<User> {
    return softDelete<User>(this.client, "user", id);
  }

  async count(filters?: Partial<User>): Promise<number> {
    return countRecords(this.client, "user", filters as unknown as Record<string, unknown>);
  }
}
