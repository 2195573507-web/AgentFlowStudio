import { describe, it, expect } from 'vitest'
import { analyzeLog } from '../../src/renderer/lib/logAnalyzer'

describe('analyzeLog', () => {
  it('detects "Cannot find module" errors', () => {
    const result = analyzeLog("Error: Cannot find module 'express'\nRequire stack:\n- /app/index.js")
    expect(result.errorType).toBeTruthy()
    expect(result.possibleCauses.length).toBeGreaterThan(0)
    expect(result.fixSteps.length).toBeGreaterThan(0)
    expect(result.suggestedCommands.length).toBeGreaterThan(0)
  })

  it('detects npm install failures', () => {
    const result = analyzeLog('npm ERR! code ENOENT\nnpm ERR! syscall access\nnpm ERR! path /app/node_modules')
    expect(result.errorType).toBeTruthy()
    expect(result.fixSteps.length).toBeGreaterThan(0)
  })

  it('detects EADDRINUSE errors', () => {
    const result = analyzeLog('EADDRINUSE: address already in use 0.0.0.0:5173')
    expect(result.errorType).toBeTruthy()
  })

  it('detects TypeScript errors', () => {
    const result = analyzeLog("src/App.tsx:10:5 - error TS2322: Type 'number' is not assignable to type 'string'.")
    expect(result.errorType).toBeTruthy()
    expect(result.suggestedCommands.length).toBeGreaterThan(0)
  })

  it('detects tilde path alias resolution errors', () => {
    const result = analyzeLog("module '~/lib/foo' path alias resolve error")
    expect(result.errorType).toBe('tsconfig 路径别名错误')
    expect(result.fixSteps.some((step) => step.includes('paths'))).toBe(true)
  })

  it('detects node-gyp failures', () => {
    const result = analyzeLog('node-gyp failed with error: cannot find build tools')
    expect(result.errorType).toBeTruthy()
  })

  it('detects better-sqlite3 build failures', () => {
    const result = analyzeLog('npm ERR! better-sqlite3@9.0.0 install: `prebuild-install`')
    expect(result.errorType).toBeTruthy()
    expect(result.fixPrompt).toBeTruthy()
  })

  it('detects Chinese character path issues', () => {
    const result = analyzeLog("Error: ENOENT: no such file or directory, open 'D:\\项目\\src\\index.ts'")
    expect(result.errorType).toBeTruthy()
  })

  it('detects Electron preload errors', () => {
    const result = analyzeLog('Unable to load preload script: D:\\app\\dist-electron\\preload.js')
    expect(result.errorType).toBeTruthy()
  })

  it('generates a fix prompt', () => {
    const result = analyzeLog("Error: Cannot find module 'react'")
    expect(result.fixPrompt).toBeTruthy()
    expect(result.fixPrompt.length).toBeGreaterThan(20)
  })

  it('returns suggestion for memory creation', () => {
    const result = analyzeLog("Error: Cannot find module 'lodash'")
    expect(typeof result.suggestMemory).toBe('boolean')
  })

  it('handles empty log gracefully', () => {
    const result = analyzeLog('')
    expect(result).toBeDefined()
    expect(result.errorType).toBeTruthy()
  })

  it('handles unrecognized log patterns gracefully', () => {
    const result = analyzeLog('some random text without known error patterns')
    expect(result).toBeDefined()
    expect(result.errorType).toBeTruthy()
    expect(result.possibleCauses).toBeInstanceOf(Array)
  })
})
