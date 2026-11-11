(*---
description: Selecting an operator argument where an expression is needed is rejected.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE operator_argument_as_expression ----
Ap(F(_), x) == F(x)
Op == Ap(LAMBDA x : x = 1, 1)
Test == Op!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 12 of module operator_argument_as_expression
    | Selected operator argument when expression expected.
    3002:1 Parsing or semantic analysis failed.
---*)
