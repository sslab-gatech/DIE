// Probability for modify non-Literal
export const INSERTION_RATIO_IN_HAVOC: number = 0.4;
export const DELETION_RATIO_IN_HAVOC: number = INSERTION_RATIO_IN_HAVOC / 4;

export const MAX_MUTATIONS: number   = 8;
export const MAX_INSERTIONS: number  = 4;
export const MAX_DELETIONS: number   = 2;

// Multiplier to the number of testcases generated for new code coverage
// TODO: Implement dynamic scaling like AFL
export const MULTIPLIER_FOR_NEW_COVERAGE: number = 2;

// Probbability to preserve type
export const TYPE_PRESERVE_RATIO: number = 0.8;
export const PRESERVE_IDENTIFIER_RATIO: number = 0.8;

// Maximum number of snippets to sync from redis
export const MIN_SNIPPETS = 64;
export const MAX_SNIPPETS = 512;

// # of mutations to make mutation chance into 1/2
export const MUTATION_CYCLE = 16;

export const MAX_FILE_SIZE_TO_INSERT = 2048;
export const MAX_FILE_SIZE_TO_ANALYZE = 128 * 1024;

export const MAX_SNIPPET_SIZE_TO_INSERT = 256;
export const MAX_SNIPPET_SIZE_TO_MUTATE = 256;

export const BITMAP_SIZE = 65536;
export const PADDING_ID_SIZE = 0; // 32; // 16 byte

export const INTERESTING_VALUES = [
  // Subset of interesting values in AFL
  -2147483648,
  -32769,
  -128,
  -1,
  0,
  1,
  16,
  32,
  64,
  100,
  127,
  1024,
  4096,
  32767,
  32768,
  65535,
  65536,
  2147483647,
  // Floating point
  1.1,
];

export const DEFAULT_HEADER = "var x=1;";
