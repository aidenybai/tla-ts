(*---
description: "ℕ lexes as an identifier, so it may be defined."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE nat_symbol_definable ----
ℕ == 1
Test == ℕ = 1
====

(*--- recorded
all:
  exit: 0
---*)
