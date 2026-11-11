(*---
description: An operator may have the same name as its module.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE operator_name_equal_module_name ----
operator_name_equal_module_name == 3
Test == operator_name_equal_module_name = 3
====

(*--- recorded
all:
  exit: 0
---*)
