(*---
description: An ASSUME with a prime is rejected by level.
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_primed ----
VARIABLE v
ASSUME v' = v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 13 of module assume_primed
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 2.
    3002:1 Parsing or semantic analysis failed.
---*)
