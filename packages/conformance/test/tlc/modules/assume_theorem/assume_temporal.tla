(*---
description: An ASSUME with a temporal operator is rejected by level.
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_temporal ----
ASSUME []TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 8, col 13 of module assume_temporal
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 3.
    3002:1 Parsing or semantic analysis failed.
---*)
