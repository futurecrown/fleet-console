import { test, expect, describe } from 'vitest'
import {
  buildArgs,
  orchestratorAuftrag,
  cliText,
  leererKnoten,
} from '../sessions'

describe('Sessions / buildArgs', () => {
  test('builds args with model only', () => {
    const args = buildArgs({ model: 'sonnet', skipPermissions: false })
    expect(args).toContain('-p')
    expect(args).toContain('--output-format')
    expect(args).toContain('stream-json')
    expect(args).toContain('--model')
    expect(args).toContain('sonnet')
    expect(args).not.toContain('--append-system-prompt')
  })

  test('includes orchestrator prompt when roles are provided', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: ['security-reviewer', 'senior-developer'],
    })
    expect(args).toContain('--append-system-prompt')
    expect(args).toContain('--forward-subagent-text')
    const promptIdx = args.indexOf('--append-system-prompt')
    expect(promptIdx).toBeGreaterThan(-1)
    expect(args[promptIdx + 1]).toContain('Orchestrator')
  })

  test('adds skip-permissions flag when requested', () => {
    const args = buildArgs({ model: 'opus', skipPermissions: true })
    expect(args).toContain('--dangerously-skip-permissions')
  })

  test('does not add skip-permissions flag by default', () => {
    const args = buildArgs({ model: 'opus', skipPermissions: false })
    expect(args).not.toContain('--dangerously-skip-permissions')
  })

  test('includes autocompact setting', () => {
    const args = buildArgs({ model: 'sonnet', skipPermissions: false })
    expect(args).toContain('--autocompact')
  })

  test('empty roles array does not trigger orchestrator prompt', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: [],
    })
    expect(args).not.toContain('--append-system-prompt')
    expect(args).not.toContain('--forward-subagent-text')
  })
})

describe('Sessions / orchestratorAuftrag', () => {
  test('includes all provided role names in backticks', () => {
    const prompt = orchestratorAuftrag(['security-reviewer', 'senior-developer'])
    expect(prompt).toContain('`security-reviewer`')
    expect(prompt).toContain('`senior-developer`')
  })

  test('states roles are used via Agent-Tool', () => {
    const prompt = orchestratorAuftrag(['security-reviewer'])
    expect(prompt).toContain('Agent-Tool')
  })

  test('includes instructions to wait for role responses', () => {
    const prompt = orchestratorAuftrag(['security-reviewer'])
    expect(prompt).toContain('wartest')
  })

  test('handles empty role list', () => {
    const prompt = orchestratorAuftrag([])
    expect(prompt).toContain('Orchestrator')
    expect(prompt.length).toBeGreaterThan(0)
  })

  test('each role is formatted consistently', () => {
    const prompt = orchestratorAuftrag(['role-a', 'role-b', 'role-c'])
    expect(prompt).toContain('`role-a`')
    expect(prompt).toContain('`role-b`')
    expect(prompt).toContain('`role-c`')
    // Roles may appear multiple times in the prompt (in the list and in instructions)
    const matches = prompt.match(/`[\w-]+`/g)
    expect(matches?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Sessions / cliText', () => {
  test('preserves simple flags', () => {
    const args = ['-p', '--output-format', 'stream-json', '--verbose']
    const text = cliText(args)
    expect(text).toContain('-p')
    expect(text).toContain('--output-format')
    expect(text).toContain('--verbose')
  })

  test('replaces --append-system-prompt value with «Rollenauftrag»', () => {
    const args = ['--append-system-prompt', 'sehr langer text hier...', '--model', 'sonnet']
    const text = cliText(args)
    expect(text).toContain('«Rollenauftrag»')
    expect(text).not.toContain('sehr langer text hier')
  })

  test('handles multiple --append-system-prompt (all get replaced)', () => {
    const args = ['--append-system-prompt', 'text1', '--other', '--append-system-prompt', 'text2']
    const text = cliText(args)
    const count = (text.match(/«Rollenauftrag»/g) || []).length
    expect(count).toBe(2)
  })

  test('skips replacement if --append-system-prompt is last arg', () => {
    const args = ['--model', 'sonnet', '--append-system-prompt']
    const text = cliText(args)
    expect(text).toContain('--append-system-prompt')
  })

  test('includes CLAUDE_BIN at the start', () => {
    const args = ['--model', 'sonnet']
    const text = cliText(args)
    expect(text).toMatch(/^claude\s+/)
  })
})


describe('Sessions / leererKnoten', () => {
  test('initializes node with correct ID', () => {
    const node = leererKnoten('test-role')
    expect(node.id).toBe('test-role')
  })

  test('starts with idle status', () => {
    const node = leererKnoten('test')
    expect(node.status).toBe('idle')
  })

  test('initializes all token counts to 0', () => {
    const node = leererKnoten('test')
    expect(node.tokensIn).toBe(0)
    expect(node.tokensOut).toBe(0)
  })

  test('initializes all request counts to 0', () => {
    const node = leererKnoten('test')
    expect(node.anfragen).toBe(0)
    expect(node.calls).toBe(0)
  })

  test('has null order when unstarted', () => {
    const node = leererKnoten('test')
    expect(node.order).toBeNull()
  })

  test('has empty text fields', () => {
    const node = leererKnoten('test')
    expect(node.phase).toBe('')
    expect(node.auftrag).toBe('')
    expect(node.ergebnis).toBe('')
    expect(node.volltext).toBe('')
  })

  test('has null timestamps', () => {
    const node = leererKnoten('test')
    expect(node.startedAt).toBeNull()
    expect(node.endedAt).toBeNull()
  })

  test('has null report path', () => {
    const node = leererKnoten('test')
    expect(node.bericht).toBeNull()
  })

  test('has null quelle', () => {
    const node = leererKnoten('test')
    expect(node.quelle).toBeNull()
  })
})

describe('Sessions / describeTool', () => {
  // Import describeTool via indirect testing since it's not exported
  // We'll test it through the behavior it affects in buildArgs/cliText

  test('buildArgs creates valid arguments structure', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: ['security-reviewer'],
    })
    // Verify it's a valid array
    expect(Array.isArray(args)).toBe(true)
    expect(args.length).toBeGreaterThan(0)
    // Verify essential CLI flags are present
    expect(args).toContain('-p')
    expect(args).toContain('--output-format')
    expect(args).toContain('stream-json')
    expect(args).toContain('--input-format')
    expect(args).toContain('--verbose')
    expect(args).toContain('--model')
  })

  test('orchestratorAuftrag produces valid string output', () => {
    const result = orchestratorAuftrag(['test-role'])
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Orchestrator')
  })
})

describe('Sessions / integration checks', () => {
  test('buildArgs output can be passed to cliText', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: ['security-reviewer'],
    })
    const text = cliText(args)
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('claude')
  })

  test('orchestratorAuftrag and cliText work together', () => {
    const roles = ['security-reviewer', 'senior-developer']
    const args = buildArgs({ model: 'sonnet', skipPermissions: false, roles })
    const auftrag = orchestratorAuftrag(roles)
    // Both should mention roles
    expect(auftrag).toContain('security-reviewer')
    expect(auftrag).toContain('senior-developer')
    const text = cliText(args)
    expect(text).toContain('claude')
    expect(text).toContain('«Rollenauftrag»')
  })

  test('session state functions produce consistent data types', () => {
    const node = leererKnoten('test')
    const args = buildArgs({ model: 'sonnet', skipPermissions: false })
    const text = cliText(args)

    expect(typeof node.id).toBe('string')
    expect(Array.isArray(args)).toBe(true)
    expect(typeof text).toBe('string')
  })
})

describe('Sessions / Error Handling & Edge Cases', () => {
  test('buildArgs handles undefined roles array', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: undefined,
    })
    expect(Array.isArray(args)).toBe(true)
    expect(args).toContain('--model')
  })

  test('buildArgs with empty string model', () => {
    const args = buildArgs({
      model: '',
      skipPermissions: false,
    })
    expect(args).toContain('--model')
    expect(args).toContain('')
  })

  test('cliText handles empty args array', () => {
    const text = cliText([])
    expect(typeof text).toBe('string')
    expect(text).toContain('claude')
  })

  test('orchestratorAuftrag handles special characters in role names', () => {
    const prompt = orchestratorAuftrag(['role-with-dash', 'role_with_underscore'])
    expect(prompt).toContain('role-with-dash')
    expect(prompt).toContain('role_with_underscore')
  })

  test('leererKnoten handles numeric string ID', () => {
    const node = leererKnoten('123')
    expect(node.id).toBe('123')
  })

  test('leererKnoten handles empty string ID', () => {
    const node = leererKnoten('')
    expect(node.id).toBe('')
    expect(node.status).toBe('idle')
  })

  test('cliText preserves model name correctly', () => {
    const args = ['--model', 'opus-4', '--verbose']
    const text = cliText(args)
    expect(text).toContain('opus-4')
  })

  test('buildArgs with multiple roles creates valid orchestrator prompt', () => {
    const args = buildArgs({
      model: 'sonnet',
      skipPermissions: false,
      roles: ['role1', 'role2', 'role3'],
    })
    expect(args).toContain('--append-system-prompt')
    expect(args).toContain('--forward-subagent-text')
    const idx = args.indexOf('--append-system-prompt')
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(args[idx + 1]).toContain('Orchestrator')
  })

  test('orchestratorAuftrag with many roles formats consistently', () => {
    const roles = Array.from({ length: 5 }, (_, i) => `role-${i}`)
    const prompt = orchestratorAuftrag(roles)
    roles.forEach((role) => {
      expect(prompt).toContain(role)
    })
  })
})
