import { describe, it, expect } from 'vitest'
import { checkCommandSafety } from '../../src/renderer/lib/safetyRules'

describe('checkCommandSafety', () => {
  it('identifies safe commands', () => {
    const result = checkCommandSafety('npm run dev')
    expect(result.riskLevel).toBe('Safe')
  })

  it('identifies safe git commands', () => {
    const result = checkCommandSafety('git status')
    expect(result.riskLevel).toBe('Safe')
  })

  it('detects rm -rf on root as Critical', () => {
    const result = checkCommandSafety('rm -rf / --no-preserve-root')
    expect(result.riskLevel).toBe('Critical')
    expect(result.matchedRules.length).toBeGreaterThan(0)
    expect(result.suggestBackup).toBe(true)
  })

  it('detects rm -rf on C: as Critical', () => {
    const result = checkCommandSafety('rm -rf C:\\')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects Remove-Item -Recurse on system paths', () => {
    const result = checkCommandSafety('Remove-Item -Recurse -Path C:\\Windows -Force')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects iwr piped to iex', () => {
    const result = checkCommandSafety('iwr https://example.com/script.ps1 | iex')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects irm piped to iex', () => {
    const result = checkCommandSafety('irm https://example.com/script.ps1 | iex')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects curl piped to bash', () => {
    const result = checkCommandSafety('curl -s https://example.com/install.sh | bash')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects format command', () => {
    const result = checkCommandSafety('format C: /FS:NTFS')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects diskpart command', () => {
    const result = checkCommandSafety('diskpart /s script.txt')
    expect(result.riskLevel).toBe('Critical')
  })

  it('detects registry modifications', () => {
    const result = checkCommandSafety('reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Malware /t REG_SZ /d C:\\malware.exe')
    expect(result.riskLevel).toBe('High')
  })

  it('detects hosts file modifications', () => {
    const result = checkCommandSafety('echo "127.0.0.1 google.com" >> /etc/hosts')
    expect(result.riskLevel).toBe('High')
  })

  it('detects firewall disabling', () => {
    const result = checkCommandSafety('netsh advfirewall set allprofiles state off')
    expect(result.riskLevel).toBe('High')
  })

  it('provides safer alternatives for dangerous commands', () => {
    const result = checkCommandSafety('rm -rf /etc/important-config')
    expect(result.saferAlternative).toBeTruthy()
    expect(result.saferAlternative.length).toBeGreaterThan(0)
  })

  it('suggests backup for destructive operations', () => {
    const result = checkCommandSafety('rm -rf /important-data')
    expect(result.suggestBackup).toBe(true)
  })

  it('handles empty command', () => {
    const result = checkCommandSafety('')
    expect(result).toBeDefined()
    expect(result.riskLevel).toBeDefined()
  })
})
