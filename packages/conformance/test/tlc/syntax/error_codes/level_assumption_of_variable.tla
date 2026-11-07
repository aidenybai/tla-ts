(*---
description: 4206 fires for an ASSUMPTION over a variable.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_assumption_of_variable ----
VARIABLE v
ASSUMPTION v = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 16 of module level_assumption_of_variable
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
