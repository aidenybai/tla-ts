(*---
description: "A LET's RECURSIVE operator is not visible outside."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE let_not_visible_outside ----
Test == LET RECURSIVE F
            F == 1
        IN TRUE
A == F
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 6 of module let_not_visible_outside
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
