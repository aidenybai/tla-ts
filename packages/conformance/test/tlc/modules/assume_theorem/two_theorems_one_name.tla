(*---
description: "A theorem name may repeat with only a warning, and the first definition stays."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [assume_theorem]
flags: [expression]
outcome: success
---*)
---- MODULE two_theorems_one_name ----
THEOREM T == TRUE
THEOREM T == FALSE
Test == T
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 18 of module two_theorems_one_name
    | Multiple declarations or definitions for symbol T.  
    | This duplicates the one at line 9, col 1 to line 9, col 17 of module two_theorems_one_name.
---*)
