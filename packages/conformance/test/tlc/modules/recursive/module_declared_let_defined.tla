(*---
description: A module-level RECURSIVE operator cannot be defined inside a LET.
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [recursive]
outcome: parse-error
---*)
---- MODULE module_declared_let_defined ----
RECURSIVE F
A == LET F == 1 IN F
F == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 10 to line 9, col 15 of module module_declared_let_defined
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 8, col 11 to line 8, col 11 of module module_declared_let_defined.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 10 to line 9, col 15 of module module_declared_let_defined
    | Recursive operator F defined at wrong LET/IN level.
    3002:1 Parsing or semantic analysis failed.
---*)
