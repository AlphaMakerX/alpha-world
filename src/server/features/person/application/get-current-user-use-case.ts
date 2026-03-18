import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";

type GetCurrentUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
    money: number;
    position: {
      x: number;
      y: number;
    };
  };
};

type GetCurrentUserFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404;
};

export type GetCurrentUserResult =
  | GetCurrentUserSuccessResult
  | GetCurrentUserFailureResult;

export type GetCurrentUserUseCaseDeps = {
  userRepository: UserRepository;
};

export async function executeGetCurrentUserUseCase(input: {
  userId: string;
}, deps: GetCurrentUserUseCaseDeps): Promise<GetCurrentUserResult> {
  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    return {
      ok: false,
      error: "用户不存在",
      status: 404,
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
      money: user.money,
      position: {
        x: user.positionX,
        y: user.positionY,
      },
    },
  };
}
