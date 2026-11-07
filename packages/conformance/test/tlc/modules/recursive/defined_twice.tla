(*---
description: A RECURSIVE operator may not be defined twice.
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [recursive]
outcome: parse-error
---*)
---- MODULE defined_twice ----
RECURSIVE F
F == 1
F == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 6 of module defined_twice
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 9, col 1 to line 9, col 6 of module defined_twice.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 6 of module defined_twice
    | Operator F already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
