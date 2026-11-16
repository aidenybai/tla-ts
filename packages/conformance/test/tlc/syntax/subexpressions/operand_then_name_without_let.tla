(*---
description: A name selector after an operand needs a LET there.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE operand_then_name_without_let ----
Op == 1 = 1
Test == Op!1!a = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module operand_then_name_without_let
    | A name selector here must be from a LET clause.
    3002:1 Parsing or semantic analysis failed.
---*)
