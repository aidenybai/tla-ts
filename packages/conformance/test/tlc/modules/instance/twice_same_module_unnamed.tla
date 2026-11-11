(*---
description: Instancing one constant-free module twice defines nothing twice.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE twice_same_module_unnamed ----
---- MODULE I ----
A == 1
====
INSTANCE I
INSTANCE I
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
