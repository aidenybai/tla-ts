(*---
description: A selector with no such label is an error.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE unknown_label ----
Op == l:: TRUE
Test == Op!m
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module unknown_label
    | Cannot find label `m'.
    3002:1 Parsing or semantic analysis failed.
---*)
