export interface TokenHasher {
  hash(plainText: string): string;
}
