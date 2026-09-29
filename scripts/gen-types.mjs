import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('src/data/supos-api.json', 'utf8'))

const typeMap = {
  String: 'string',
  Number: 'number',
  Integer: 'number',
  Boolean: 'boolean',
  Any: 'any',
  Component: 'any',
  Function: '(...args: any[]) => any',
  Object: 'Record<string, any>',
  'Array<String>': 'string[]',
  'Array<Object>': 'Record<string, any>[]'
}

const pascal = (...strs) => {
  let res = ''
  for (let s of strs) {
    res += s[0].toUpperCase() + s.slice(1)
  }
  return res
}

// 存放 interface 嵌套转换的 interface
const interfaces = []

/** 将某项参数转换为 ts 格式
 * @param {Object} api
 * @param {Object} param
 * @returns {string}
 */
const renderParam = (api, param) => {
  if (!api?.params?.length) return
  let t = typeMap[param.type] ?? 'any'
  if (param.type === 'Object' && param.fields) {
    // 对象参数 interface
    t = pascal(api.name, param.name) // 大驼峰类型接口名称
    const CmtBlkLine = `  /** ${param.desc ?? ''} */\n` // 顶部块注释
    const interfaceLine = `  interface ${t} {\n` // interface AbbCdd {
    const paramsBlock =
      param.fields
        .map(
          (f) => `    /** ${f.desc ?? ''} */
    ${f.name}${f.required ? '' : '?'}: ${typeMap[f.type] ?? 'any'}`
        )
        .join('\n') + '\n  }\n' // 注释+参数

    interfaces.push(CmtBlkLine + interfaceLine + paramsBlock)
  } else if (param.fields) {
    // 基本类型参数可选
    t = param.fields.map((f) => `'${f.name}'`).join(' | ')
  } else if (param.type === 'Object') {
    t = 'Record<string, any>'
  }
  return `${param.name}${param.required ? '' : '?'}: ${t}`
}

/** 将整个 apis 列表渲染为 ts 的 interface 格式
 * @param {Object[]} apis
 * @returns {string}
 */
const renderInterface = (apis) => {
  return apis
    .map(
      (a) => `
    /** ${a.brief}${a.params?.length ? '\n' : ''}${(a.params ?? []).map((p) => `     * @param ${p.name} ${p.desc ?? ''}`).join('\n')}
     * @example\n${a.example
       .replace(/\*\//, '*\\/')
       .split('\n')
       .map((line) => `     * ${line}`)
       .join('\n')}
     */
    ${a.name}(${(a.params ?? []).map((p) => renderParam(a, p)).join(', ')}): any
  `
      // ↑ (a1: p1, a2: p2, ...): any
    )
    .join('')
}

// renderParam 会往 interfaces 里塞嵌套 interface，必须先渲染完再取 interfaceOut
const scriptUtilOut = renderInterface(data.scriptUtil)
const osApiOut = renderInterface(data['$os.api'])
const osOut = renderInterface(data.$os)
const interfaceOut = interfaces.join('')

const out = `declare namespace supos {${interfaceOut ? `\n${interfaceOut}` : ''}
  interface ScriptUtil {${scriptUtilOut}}
  interface OsApi {${osApiOut}}
  interface Os extends ScriptUtil {
  api: OsApi // $os 是基于 scriptUtil 二次封装的 ${osOut}}
}

// 全局声明
declare const scriptUtil: supos.ScriptUtil
declare const $os: supos.Os`

const dts = '// 由 scripts/gen-types.mjs 生成，请勿手改！\n\n' + out + '\n'

fs.mkdirSync('types', { recursive: true })
fs.writeFileSync('types/supos.d.ts', dts)
console.log('generated types -> types/supos.d.ts')
