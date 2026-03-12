import { userRepository } from "@/server/features/person/infrastructure";

type GetCurrentUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
    money: number;
  };
};

type GetCurrentUserFailureResult = {
  ok: false;
  error: string;
  status: 404;
};

export type GetCurrentUserResult =
  | GetCurrentUserSuccessResult
  | GetCurrentUserFailureResult;

export async function executeGetCurrentUserUseCase(input: {
  userId: string;
}): Promise<GetCurrentUserResult> {
  const user = await userRepository.findById(input.userId);
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
    },
  };
}
