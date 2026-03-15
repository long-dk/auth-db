import { IUserRepository } from "./user.repository.interface";

export interface IAuthDbManager {
  userRepository: IUserRepository;
  disconnect(): Promise<void>;
}
