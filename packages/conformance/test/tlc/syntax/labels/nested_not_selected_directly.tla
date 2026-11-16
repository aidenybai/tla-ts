(*---
description: An inner label is not a label of the definition itself.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE nested_not_selected_directly ----
Op == l:: (m:: TRUE) /\ (n:: TRUE)
Test == Op!m
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module nested_not_selected_directly
    | Cannot find label `m'.
    3002:1 Parsing or semantic analysis failed.
---*)
