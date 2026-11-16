(*---
description: "An unnamed instance's definition with an outer definition's name and arity warns, and the outer one stays."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE instance_clash_with_prior_definition_warns ----
---- MODULE I ----
A == 1
B == 1
====
A == 7
INSTANCE I
Test == A = 7 /\ B = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 6 of module instance_clash_with_prior_definition_warns
    | Multiple declarations or definitions for symbol A.  
    | This duplicates the one at line 13, col 1 to line 13, col 6 of module instance_clash_with_prior_definition_warns.
---*)
