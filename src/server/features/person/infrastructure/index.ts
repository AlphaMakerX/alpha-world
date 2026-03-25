// Person infrastructure layer entrypoint.
export * from "./schema";
export * from "./user-repository";
export * from "./transaction-ledger-repository";
export * from "./person-query-repository";

import { SystemAccountServiceImpl } from "@/server/features/person/domain/services/system-account-service";
import { userRepository } from "./user-repository";

export const systemAccountService = new SystemAccountServiceImpl(userRepository);
