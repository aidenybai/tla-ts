(*---
description: An ASSUME calling a state-level operator is rejected by level.
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_non_constant_operator ----
VARIABLE v
A == v
ASSUME A
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 8 of module assume_non_constant_operator
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
