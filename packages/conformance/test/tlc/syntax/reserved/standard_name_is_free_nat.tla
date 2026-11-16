(*---
description: "Nat is not reserved: without its standard module it is an ordinary name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [reserved]
flags: [expression]
outcome: success
---*)
---- MODULE standard_name_is_free_nat ----
Nat == 3
Test == Nat = 3
====

(*--- recorded
all:
  exit: 0
---*)
