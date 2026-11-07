(*---
description: A definition may reuse an earlier LET name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE let_name_defined_later ----
A == LET B == 1 IN B
B == 2
Test == A = 1 /\ B = 2
====

(*--- recorded
all:
  exit: 0
---*)
