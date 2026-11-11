(*---
description: A named instance may not list a target twice.
ref: "tla2sany/semantic/SubstInNode.java#addExplicitSubstitute"
features: [instance]
outcome: parse-error
---*)
---- MODULE with_duplicate_target_named ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- 1, c <- 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 35 to line 12, col 35 of module with_duplicate_target_named
    | Multiple substitutions for symbol 'c' in substitution.
    3002:1 Parsing or semantic analysis failed.
---*)
