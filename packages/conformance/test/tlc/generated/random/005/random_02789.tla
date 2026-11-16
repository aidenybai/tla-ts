(*---
description: Evaluates a random record expression, seed 262, number 2789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([x \in 1..2 |-> x])[0] \div Len({})), b |-> ((<<>> = (1 :> 2)) \/ (<<>> = (1 :> 2)))] EXCEPT !.a = @ + Cardinality({b4412 \in {b4413 \in [a |-> 1] : FALSE} : ({2, 1, 3} = 2..1)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02789 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
