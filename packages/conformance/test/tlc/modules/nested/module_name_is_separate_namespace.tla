(*---
description: "A nested module's name and an operator's name are in separate namespaces."
ref: "tla2sany/semantic/SymbolTable.java#addModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE module_name_is_separate_namespace ----
I == 7
---- MODULE I ----
A == 8
====
INSTANCE I
Test == I = 7 /\ A = 8
====

(*--- recorded
all:
  exit: 0
---*)
