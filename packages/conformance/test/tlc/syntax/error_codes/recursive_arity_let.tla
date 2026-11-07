(*---
description: 4292 fires in a LET.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_arity_let ----
A == LET RECURSIVE F(_)
         F == 1
     IN F
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 10 to line 9, col 15 of module recursive_arity_let
    | Definition of F has different arity than its RECURSIVE declaration.
    | line 10, col 9 to line 10, col 9 of module recursive_arity_let
    | The operator F requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
