import { test, expect, describe } from 'vitest'
import { PIPELINE_PARALLEL, ROLE_TIMEOUT_SEC, GRACE_SEC, DIFF_MAX } from '../config'

describe('Config', () => {
  test('has expected configs defined or defaults', () => {
    expect(PIPELINE_PARALLEL).toBe(3)
    expect(ROLE_TIMEOUT_SEC).toBe(900)
    expect(GRACE_SEC).toBe(10)
    expect(DIFF_MAX).toBe(60000)
  })
})
