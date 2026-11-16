(*---
description: Evaluates a random int expression, seed 262, number 3832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x])[0] - (-1 = -1)) * Cardinality({b6038 : b6038 \in {x \in 1..3 : x > 1}})) * (CHOOSE b6039 \in ((-1 * 2147483647) \cap {1 : b6040 \in {2, 1, 3}}) : ((\E b6041 \in Nat : FALSE) \/ (TRUE <=> {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03832 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
