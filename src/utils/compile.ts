import { transform } from '@swc/core'

export const compileComponent = async (code: string, fileName: string, languageId: string) => {
  const typescript = languageId.startsWith('typescript')
  const { code: compiled } = await transform(code, {
    filename: fileName,
    jsc: {
      parser: typescript
        ? { syntax: 'typescript', tsx: languageId === 'typescriptreact' }
        : { syntax: 'ecmascript', jsx: true },
      target: 'es2015',
      transform: { react: { runtime: 'classic' } }
    },
    module: { type: 'commonjs' },
    sourceMaps: false
  })
  return compiled
}
