(*---
description: The syntax corpus case "Higher-Order Operator Parameter Declarations" in operators.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE operators_higher_order_operator_parameter_declarations ----
f(x, g(_, _), _+_, -._, _^+) == x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
