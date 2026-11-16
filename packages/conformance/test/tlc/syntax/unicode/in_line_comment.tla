(*---
description: Unicode symbols in a line comment are skipped.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE in_line_comment ----
\* ∧ ∀ ≜
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
