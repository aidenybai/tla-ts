(*---
description: Evaluates a random record expression, seed 262, number 7826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE b12086 \in {1} : TRUE) % ([x \in 1..2 |-> x])[2147483647]) \div Cardinality(({1} \cap {}))), b |-> (([[a |-> 1] EXCEPT !.a = 2147483647] = (CHOOSE r \in [a : {}] : TRUE)) <=> ((\E b12087 \in 3 : TRUE) <=> (\A b12088 \in 1..3 : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07826 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
