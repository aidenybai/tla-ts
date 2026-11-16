(*---
description: Instancing a module with declarations twice unnamed leaves the first definition and warns.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE twice_with_parameters_first_wins ----
---- MODULE I ----
CONSTANT c
d == c
====
INSTANCE I WITH c <- 1
INSTANCE I WITH c <- 2
Test == d = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 22 of module twice_with_parameters_first_wins
    | Multiple declarations or definitions for symbol d.  
    | This duplicates the one at line 13, col 1 to line 13, col 22 of module twice_with_parameters_first_wins.
---*)
