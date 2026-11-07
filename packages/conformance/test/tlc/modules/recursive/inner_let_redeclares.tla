(*---
description: "An inner LET's RECURSIVE declaration of a name in scope only warns, so the LET's definition is then at the wrong level."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE inner_let_redeclares ----
RECURSIVE F
A == LET RECURSIVE F
         F == 1
     IN F
F == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 2
    | line 9, col 20 to line 9, col 20 of module inner_let_redeclares
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 8, col 11 to line 8, col 11 of module inner_let_redeclares.
    | line 10, col 10 to line 10, col 15 of module inner_let_redeclares
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 8, col 11 to line 8, col 11 of module inner_let_redeclares.
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 10 to line 10, col 15 of module inner_let_redeclares
    | Recursive operator F defined at wrong LET/IN level.
    | line 9, col 20 to line 9, col 20 of module inner_let_redeclares
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
