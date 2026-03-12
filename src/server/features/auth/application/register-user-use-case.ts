import { z } from "zod";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { User } from "@/server/features/person/domain/entities/user";
import { userRepository } from "@/server/features/person/infrastructure";

const registerUserSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 位").max(32, "用户名最多 32 位"),
  password: z.string().min(6, "密码至少 6 位").max(128, "密码最多 128 位"),
});

type RegisterUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

type RegisterUserFailureResult = {
  ok: false;
  error: string;
  status: 400 | 409;
};

export type RegisterUserResult = RegisterUserSuccessResult | RegisterUserFailureResult;

export async function executeRegisterUserUseCase(
  input: unknown,
): Promise<RegisterUserResult> {
  const parsed = registerUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const existingUser = await userRepository.findByUsername(parsed.data.username);
  if (existingUser) {
    return {
      ok: false,
      error: "用户名已存在",
      status: 409,
    };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const user = User.register({
    id: randomUUID(),
    username: parsed.data.username,
    passwordHash,
  });
  await userRepository.save(user);

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
