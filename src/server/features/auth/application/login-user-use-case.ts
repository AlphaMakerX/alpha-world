import { z } from "zod";
import { compare } from "bcryptjs";
import { userRepository } from "@/server/features/person/infrastructure";
import { ADAM_USER_ID } from "@/server/features/shared-kernel/domain/adam";

const loginUserSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(6).max(128),
});

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

export async function executeLoginUserUseCase(input: unknown): Promise<LoginUserResult> {
  const parsed = loginUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "参数校验失败",
    };
  }

  const user = await userRepository.findByUsername(parsed.data.username);
  if (!user) {
    return {
      ok: false,
      error: "用户名或密码错误",
    };
  }

  if (user.id === ADAM_USER_ID) {
    return {
      ok: false,
      error: "系统账户不允许登录",
    };
  }

  const matched = await compare(parsed.data.password, user.passwordHash);
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
