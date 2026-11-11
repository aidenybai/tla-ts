(*---
description: "!(@) cannot stand as an operator argument."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE at_in_parens_as_operator ----
Ap(F(_), v) == F(v)
Op == \A a \in {1} : a = 1
Test == Ap(Op!(@), 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 15 to line 10, col 17 of module at_in_parens_as_operator
    | Selector `!(...)' should not have argument(s).
    | line 10, col 9 to line 10, col 21 of module at_in_parens_as_operator
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
