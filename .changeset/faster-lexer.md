---
"tla-ts": patch
---

Read TLA+ source faster. The lexer classifies characters by code through one table instead of testing them with regular expressions, and tries only the operators that start with the current character.
