(*---
description: "∧ works as infix /\\."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE and_infix ----
Test == TRUE ∧ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
