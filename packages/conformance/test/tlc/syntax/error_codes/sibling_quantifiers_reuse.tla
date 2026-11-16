(*---
description: Sibling quantifiers may reuse bound names.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE sibling_quantifiers_reuse ----
Test == (\A x \in {1} : x = 1) /\ (\A x \in {2} : x = 2)
====

(*--- recorded
all:
  exit: 0
---*)
