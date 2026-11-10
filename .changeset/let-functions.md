---
"tla-ts": patch
---

Compile a function defined in a `LET`, such as `LET f[x \in S] == ...`, once instead of each time the `LET` is evaluated. The mongodb-txns `ClientCentricTests` falls from 47.4 G to 41.6 G instructions and from 372 MB to 113 MB, and `MCKVsnap` from 115.3 G to 105.3 G and from 488 MB to 294 MB.
