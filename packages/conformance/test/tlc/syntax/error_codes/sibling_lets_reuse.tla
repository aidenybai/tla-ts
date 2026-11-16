(*---
description: Sibling LET expressions may reuse names.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE sibling_lets_reuse ----
Test == (LET a == 1 IN a) = 1 /\ (LET a == 2 IN a) = 2
====

(*--- recorded
all:
  exit: 0
---*)
