(*---
description: "Only a LAMBDA argument can be entered, not a named operator argument."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE named_operator_argument_no_selector ----
Ap(F(_), x) == F(x)
Id(x) == x
Op == Ap(Id, 1)
Test == Op!1!(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 14 to line 11, col 16 of module named_operator_argument_no_selector
    | Trying to select subexpression of an operator argument.
    3002:1 Parsing or semantic analysis failed.
---*)
