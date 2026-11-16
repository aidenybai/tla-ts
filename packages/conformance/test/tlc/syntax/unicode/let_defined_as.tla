(*---
description: ≜ works in a LET.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE let_defined_as ----
Test == LET x ≜ 1 IN x = 1
====

(*--- recorded
all:
  exit: 0
---*)
