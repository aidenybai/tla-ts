---
"tla-ts": patch
---

Start checking small specs faster. TLC's orders reuse the parse of the root module, the contexts of TLC's own modules are built once per process, and SANY's context tables hash each name once.
