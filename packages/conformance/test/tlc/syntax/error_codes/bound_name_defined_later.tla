(*---
description: "A definition may reuse an earlier scope's bound name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE bound_name_defined_later ----
A == \A B \in {1} : B = 1
B == 2
Test == A /\ B = 2
====

(*--- recorded
all:
  exit: 0
---*)
