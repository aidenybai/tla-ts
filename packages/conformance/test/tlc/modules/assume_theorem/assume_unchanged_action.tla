(*---
description: "UNCHANGED has action level, so it cannot be in an ASSUME."
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_unchanged_action ----
ASSUME UNCHANGED 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 8, col 18 of module assume_unchanged_action
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 2.
    3002:1 Parsing or semantic analysis failed.
---*)
