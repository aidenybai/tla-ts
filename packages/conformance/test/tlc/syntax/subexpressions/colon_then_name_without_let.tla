(*---
description: "!:! needs a LET."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE colon_then_name_without_let ----
Op == l:: 1 = 1
Test == Op!:!l
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module colon_then_name_without_let
    | A name selector here must be from a LET clause.
    3002:1 Parsing or semantic analysis failed.
---*)
