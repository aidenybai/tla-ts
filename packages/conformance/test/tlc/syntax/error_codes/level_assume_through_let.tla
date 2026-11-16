(*---
description: 4206 fires for an ASSUME reading a variable through LET.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_assume_through_let ----
VARIABLE v
ASSUME LET a == v IN a = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 26 of module level_assume_through_let
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
