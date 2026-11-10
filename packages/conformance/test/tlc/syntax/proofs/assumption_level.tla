(*---
description: "Module-level ASSUME is constant level, while theorems are not limited."
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [proofs]
outcome: parse-error
---*)
---- MODULE assumption_level ----
VARIABLE v
THEOREM v = 1
ASSUME v = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 12 of module assumption_level
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
