(*---
description: Two labels in one label set cannot share a name.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE siblings_duplicate ----
Op == (l:: TRUE) /\ (l:: TRUE)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 22 to line 8, col 29 of module siblings_duplicate
    | Duplicate label `l'.
    3002:1 Parsing or semantic analysis failed.
---*)
