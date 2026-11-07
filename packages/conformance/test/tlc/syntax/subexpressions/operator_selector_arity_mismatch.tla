(*---
description: A selected operator argument must have the expected arity.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE operator_selector_arity_mismatch ----
EXTENDS Naturals
Ap(F(_,_), x) == F(x, x)
Op(a) == a + 1
Test == Ap(Op!1, 7) = 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 12 to line 11, col 15 of module operator_selector_arity_mismatch
    | Expected arity 2 but found operator of arity 1.
    | line 11, col 9 to line 11, col 19 of module operator_selector_arity_mismatch
    | Argument number 1 to operator 'Ap' 
    | should be a 2-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
