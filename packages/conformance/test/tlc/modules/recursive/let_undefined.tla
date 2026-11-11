(*---
description: "A LET's RECURSIVE operator must be defined in that LET."
ref: "tla2sany/semantic/Generator.java#checkForUndefinedRecursiveOps"
features: [recursive]
outcome: parse-error
---*)
---- MODULE let_undefined ----
Test == LET RECURSIVE F
        IN TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 23 to line 8, col 23 of module let_undefined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
