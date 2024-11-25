declare module 'circomlibjs' {
    export function buildPoseidon(): Promise<{
      F: any;
      poseidon(inputs: (string | bigint)[]): bigint;
    }>;
  }