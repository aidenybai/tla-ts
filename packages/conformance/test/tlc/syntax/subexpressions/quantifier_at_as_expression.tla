(*---
description: "!@ picks a quantifier body as an operator, which an expression position does not accept."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE quantifier_at_as_expression ----
Op == \A x \in {1} : x = 2
Test == Op!@
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 12 of module quantifier_at_as_expression
    | Expected 1 arguments but found 0.
    3002:1 Parsing or semantic analysis failed.
---*)
