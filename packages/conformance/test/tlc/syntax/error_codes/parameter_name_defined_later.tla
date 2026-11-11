(*---
description: "A definition may reuse an earlier operator's parameter name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_name_defined_later ----
A(B) == B
B == 2
Test == A(1) = 1 /\ B = 2
====

(*--- recorded
all:
  exit: 0
---*)
