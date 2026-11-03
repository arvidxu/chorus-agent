import { describe, expect, test } from 'vitest'
import { classifyJobs } from '../retry.mjs'

const neverStarted = { conclusion: 'cancelled', runner_name: '', steps: [] }

describe('classifyJobs', () => {
  test('finds a job cancelled for lack of a machine', () => {
    const job = { ...neverStarted, id: 1 }
    expect(classifyJobs([job], () => true)).toEqual({ shortages: [job], others: [] })
  })

  test('does not count a job that only followed from a cancelled one', () => {
    expect(classifyJobs([neverStarted], () => false)).toEqual({ shortages: [], others: [] })
  })

  test('reports a job that ran and failed', () => {
    const failed = { conclusion: 'failure', runner_name: 'mac', steps: [{}] }
    const { shortages, others } = classifyJobs([failed, neverStarted], () => true)
    expect(others).toEqual([failed])
    expect(shortages).toEqual([neverStarted])
  })
})
