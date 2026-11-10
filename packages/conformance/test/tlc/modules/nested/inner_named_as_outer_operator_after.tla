(*---
description: "An operator may take a nested module's name after it."
ref: "tla2sany/semantic/SymbolTable.java#addModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE inner_named_as_outer_operator_after ----
---- MODULE I ----
A == 8
====
I == 7
M == INSTANCE I
Test == I = 7 /\ M!A = 8
====

(*--- recorded
all:
  exit: 0
---*)
