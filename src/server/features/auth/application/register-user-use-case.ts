import { z } from "zod";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { User } from "@/server/features/person/domain/entities/user";
import { userRepository, transactionLedgerRepository } from "@/server/features/person/infrastructure";
import { ADAM_USER_ID, ADAM_USERNAME } from "@/server/features/shared-kernel/domain/adam";

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

  if (parsed.data.username.trim().toLowerCase() === ADAM_USERNAME) {
    return {
      ok: false,
      error: "该用户名为系统保留名称",
      status: 409,
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

  const adam = await userRepository.findById(ADAM_USER_ID);
  if (!adam) {
    return {
      ok: false,
      error: "系统尚未初始化，请先运行 init:system",
      status: 400,
    };
  }

  const initialMoney = 10000;
  const passwordHash = await hash(parsed.data.password, 10);
  const user = User.register({
    id: randomUUID(),
    username: parsed.data.username,
    passwordHash,
    initialMoney,
  });

  adam.spendMoney(initialMoney);
  await userRepository.save(adam);
  await userRepository.save(user);
  await transactionLedgerRepository.record({
    fromUserId: ADAM_USER_ID,
    toUserId: user.id,
    amount: initialMoney,
    type: "registration_grant",
    description: `注册赠金 → ${user.username.getValue()}`,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
