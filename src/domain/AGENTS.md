# src/domain 知识库

## OVERVIEW

业务逻辑核心层，包含纯函数工具、错误处理和结果类型。允许 schema 等业务依赖，但不依赖 adapters、transports 或协议 I/O。

## STRUCTURE

```
domain/
├── errors.ts       # DomainError 类与 ErrorCode 常量
├── result.ts       # JsonSuccess/JsonFailure 联合类型
└── tools/
    ├── index.ts    # MCP 注册边界，导出 domainTools 数组
    ├── add.ts      # 示例：两数相加工具
    └── echo.ts     # 示例：回显工具
```

## WHERE TO LOOK

| 任务               | 位置                            | 说明                                             |
| ------------------ | ------------------------------- | ------------------------------------------------ |
| 新增 MCP 工具      | `tools/*.ts` + `tools/index.ts` | 创建文件后加入 `domainTools` 数组                |
| 错误语义           | `errors.ts`                     | 使用 `DomainError` 和 `ErrorCode`                |
| 通用 JSON 结果类型 | `result.ts`                     | `JsonSuccess<T>` / `JsonFailure`，按调用契约选用 |

## CONVENTIONS

**新工具标准模式**（参考 `add.ts` / `echo.ts`）：

1. 定义 Zod schema：`export const myToolInputSchema = z.object({...})`
2. 推导输入类型：`export type MyInput = z.infer<typeof myToolInputSchema>`
3. 定义输出类型：`export type MyOutput = { ... }`
4. 导出工具元数据：`name`、`title`、`description`、`inputSchema`
5. 实现 run 函数：内部再次 `schema.parse(input)`，返回 `Promise<MyOutput>`
6. 加入 `tools/index.ts` 的 `domainTools` 数组，MCP 自动暴露

**CLI 暴露需额外接线**：在 `src/adapters/cli/commands/tools.ts` 显式添加命令。

**业务函数防御**：即使 MCP 层已校验，run 函数内部必须再次 `parse()`。

**错误处理**：业务或配置错误使用 `DomainError` + `ErrorCode`；schema 校验错误保留 Zod 语义，由 adapter 映射。

**依赖方向**：adapters 依赖 domain，domain 不可反向依赖 adapters/transports/CLI/process I/O。

## ANTI-PATTERNS

- 在 domain 内使用 `console.log`、`process.stdin`、`fetch` 等外部 I/O
- 新增工具后忘记加入 `domainTools` 数组
- 在 run 函数内跳过二次 parse
- 使用 `any` 或未推导的输入输出类型

## NOTES

新增工具后同步更新 `tests/domain/` 对应测试文件。
