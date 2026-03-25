import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";

export type LoginUserCommand = {
  username: string;
  password: string;
};

type LoginUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

type LoginUserFailureResult = {
  ok: false;
  error: string;
};

export type LoginUserResult = LoginUserSuccessResult | LoginUserFailureResult;

export type LoginUserUseCaseDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

export async function executeLoginUserUseCase(
  command: LoginUserCommand,
  deps: LoginUserUseCaseDeps,
): Promise<LoginUserResult> {
  const username = Username.create(command.username);
  const user = await deps.userRepository.findByUsername(username);
  if (!user) {
    return {
      ok: false,
      error: "用户名或密码错误",
    };
  }

  const matched = await deps.passwordHasher.verify(command.password, user.passwordHash);
  if (!matched) {
    return {
      ok: false,
      error: "用户名或密码错误",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
