import type { User } from "@/server/features/person/domain/entities/user";
import type { Username } from "@/server/features/person/domain/value-objects/username";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  save(user: User): Promise<void>;
}
