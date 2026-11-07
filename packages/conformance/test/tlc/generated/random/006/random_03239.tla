(*---
description: Evaluates a random function expression, seed 262, number 3239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b5148 == 2147483647 IN b5148 :> (7 * 2)))[([b5149 \in {} |-> 1])[(CHOOSE b5150 \in {x \in 1..3 : x > 1} : TRUE)]] :> (CHOOSE b5151 \in ((3 \div 0) .. LET b5152 == -1 IN b5152) : ((\A b5153 \in 2..1 : TRUE) => (<<3, 1, 2>> = [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03239 failed.
    In applying the function
    <<>>,
    the first argument is:
    2
    which is not in its domain.
---*)
