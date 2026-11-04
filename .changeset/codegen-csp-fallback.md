---
"tla-ts": patch
---

Check specs in hosts that disallow code generation from strings, such as Cloudflare Workers or a page whose CSP lacks `'unsafe-eval'`. `check()` used to throw an `EvalError` there. It now evaluates with the interpreter instead of generated code.
