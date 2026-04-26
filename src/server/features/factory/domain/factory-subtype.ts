/** 工厂子类型常量数组 */
export const FACTORY_SUBTYPES = [
  "mine",
  "lumber_mill",
  "textile_mill",
  "ranch",
  "apothecary",
  "waterworks",
  "smelter",
  "carpentry",
  "paper_mill",
  "assembler",
] as const;

/** 工厂子类型联合类型 */
export type FactorySubtype = (typeof FACTORY_SUBTYPES)[number];

/** 工厂最高等级 */
export const MAX_FACTORY_LEVEL = 3;

/** 校验字符串是否为有效的工厂子类型 */
export function isValidFactorySubtype(value: string): value is FactorySubtype {
  return (FACTORY_SUBTYPES as readonly string[]).includes(value);
}
