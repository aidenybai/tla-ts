(*---
description: "Seq is not reserved: without its standard module it is an ordinary name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [reserved]
flags: [expression]
outcome: success
---*)
---- MODULE standard_name_is_free_seq ----
Seq == 3
Test == Seq = 3
====

(*--- recorded
all:
  exit: 0
---*)
