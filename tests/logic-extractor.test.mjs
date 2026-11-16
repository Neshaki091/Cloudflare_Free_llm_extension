import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCodeLogic } from '../src/extension/src/context/logicExtractor.ts';

test('Logic Extractor - Successfully extracts Python functions, classes, and skeletonizes body', () => {
  const pythonCode = `
import math
from typing import List

class PrimeCalculator:
    """Class hỗ trợ tính toán số nguyên tố."""
    def __init__(self, limit: int):
        self.limit = limit
        self.results = []

    def compute_primes(self) -> List[int]:
        """Tính toán danh sách số nguyên tố."""
        primes = []
        for num in range(2, self.limit + 1):
            if self.is_prime(num):
                primes.append(num)
        return primes

    def is_prime(self, n: int) -> bool:
        if n <= 1:
            return False
        for i in range(2, int(math.sqrt(n)) + 1):
            if n % i == 0:
                return False
        return True

if __name__ == '__main__':
    calc = PrimeCalculator(100)
    print(calc.compute_primes())
  `;

  const result = extractCodeLogic('calc.py', pythonCode, 'python');
  assert.equal(result.language, 'python');
  assert.ok(result.symbolNames.includes('PrimeCalculator'));
  assert.ok(result.symbolNames.includes('compute_primes'));
  assert.ok(result.symbolNames.includes('is_prime'));
  assert.ok(result.logicOutline.includes('class PrimeCalculator:'));
  assert.ok(result.logicOutline.includes('def compute_primes(self) -> List[int]:'));
  assert.ok(result.logicOutline.includes('def is_prime(self, n: int) -> bool:'));
  assert.ok(result.logicOutline.includes('... # [logic thực thi]'));
  assert.ok(result.extractedLines < result.totalOriginalLines);
});

test('Logic Extractor - Successfully extracts TypeScript interfaces, types and functions', () => {
  const tsCode = `
import { Request } from 'express';

export interface UserConfig {
  id: string;
  name: string;
  active: boolean;
}

export type Status = 'idle' | 'running' | 'done';

export class Runner {
  public async execute(config: UserConfig): Promise<Status> {
    console.log("Starting...");
    return 'done';
  }
}

export function helper(): void {
  // do something
}
  `;

  const result = extractCodeLogic('runner.ts', tsCode, 'typescript');
  assert.ok(result.symbolNames.includes('UserConfig'));
  assert.ok(result.symbolNames.includes('Status'));
  assert.ok(result.symbolNames.includes('Runner'));
  assert.ok(result.symbolNames.includes('helper'));
  assert.ok(result.logicOutline.includes('export interface UserConfig'));
  assert.ok(result.logicOutline.includes('export type Status'));
});
