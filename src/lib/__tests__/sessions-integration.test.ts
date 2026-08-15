import { test, expect, describe } from 'vitest'
import {
  leererKnoten,
  PRUEFAUFTRAG,
} from '../sessions'

describe('Sessions / Integration - Node State', () => {
  test('multiple nodes can be created independently', () => {
    const node1 = leererKnoten('orchestrator')
    const node2 = leererKnoten('security-reviewer')
    const node3 = leererKnoten('senior-developer')

    expect(node1.id).toBe('orchestrator')
    expect(node2.id).toBe('security-reviewer')
    expect(node3.id).toBe('senior-developer')

    // Nodes are independent
    expect(node1.status).toBe('idle')
    expect(node2.status).toBe('idle')
    expect(node3.status).toBe('idle')
  })

  test('nodes have distinct state despite same initialization', () => {
    const nodes = ['role1', 'role2', 'role3'].map(leererKnoten)

    expect(nodes.length).toBe(3)
    nodes.forEach((node, idx) => {
      expect(node.id).toBe(`role${idx + 1}`)
      expect(node.status).toBe('idle')
      expect(node.tokensIn).toBe(0)
      expect(node.tokensOut).toBe(0)
    })
  })

  test('node fields are properly initialized to defaults', () => {
    const node = leererKnoten('test-role')

    // String fields are empty
    expect(node.phase).toBe('')
    expect(node.auftrag).toBe('')
    expect(node.ergebnis).toBe('')
    expect(node.volltext).toBe('')

    // Numeric fields are 0
    expect(node.tokensIn).toBe(0)
    expect(node.tokensOut).toBe(0)
    expect(node.anfragen).toBe(0)
    expect(node.calls).toBe(0)

    // Null fields are null
    expect(node.startedAt).toBeNull()
    expect(node.endedAt).toBeNull()
    expect(node.order).toBeNull()
    expect(node.bericht).toBeNull()
    expect(node.quelle).toBeNull()
  })
})

describe('Sessions / Integration - PRUEFAUFTRAG', () => {
  test('PRUEFAUFTRAG is properly defined', () => {
    expect(PRUEFAUFTRAG).toBeDefined()
    expect(typeof PRUEFAUFTRAG).toBe('string')
    expect(PRUEFAUFTRAG.length).toBeGreaterThan(0)
  })

  test('PRUEFAUFTRAG contains key instructions', () => {
    expect(PRUEFAUFTRAG).toContain('git diff')
    expect(PRUEFAUFTRAG).toContain('uncommitteten')
    expect(PRUEFAUFTRAG).toContain('git status')
  })

  test('PRUEFAUFTRAG instructs to read only changed files', () => {
    expect(PRUEFAUFTRAG).toContain('Datei')
  })

  test('PRUEFAUFTRAG is marked as review task', () => {
    expect(PRUEFAUFTRAG).toContain('Prüfe')
  })

  test('PRUEFAUFTRAG does not allow modifications', () => {
    expect(PRUEFAUFTRAG).toContain('Nimm keine Änderungen vor')
  })
})

describe('Sessions / Constants - Node Status', () => {
  test('idle node can be created for orchestrator', () => {
    const node = leererKnoten('orchestrator')
    expect(node.status).toBe('idle')
    expect(node.id).toBe('orchestrator')
  })

  test('idle node can be created for roles', () => {
    const roleNames = ['security-reviewer', 'senior-developer', 'business-analyst']

    roleNames.forEach((name) => {
      const node = leererKnoten(name)
      expect(node.status).toBe('idle')
      expect(node.id).toBe(name)
      expect(node.phase).toBe('')
    })
  })

  test('node order starts as null until assigned', () => {
    const node = leererKnoten('test')
    expect(node.order).toBeNull()
  })

  test('nodes start with no calls recorded', () => {
    const node = leererKnoten('test')
    expect(node.calls).toBe(0)
    expect(node.anfragen).toBe(0)
  })
})

describe('Sessions / Integration - Session Constants', () => {
  test('PRUEFAUFTRAG mentions review context', () => {
    expect(PRUEFAUFTRAG).toContain('Prüfe')
  })

  test('PRUEFAUFTRAG is a properly formatted string', () => {
    // PRUEFAUFTRAG uses .join(' ') so it's technically single line with spaces
    expect(PRUEFAUFTRAG.startsWith('Prüfe')).toBe(true)
    expect(PRUEFAUFTRAG).toMatch(/\.$/m) // Ends with period
  })

  test('PRUEFAUFTRAG provides complete instructions', () => {
    // Should tell how to get the diff
    expect(PRUEFAUFTRAG).toContain('git diff')
    // Should tell how to get status
    expect(PRUEFAUFTRAG).toContain('git status')
    // Should limit scope
    expect(PRUEFAUFTRAG).toContain('Datei')
  })
})
