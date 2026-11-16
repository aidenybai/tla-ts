(*---
description: Evaluates a random seq expression, seed 262, number 4950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7698 == (([x \in Nat |-> x + 1])[7] + (0 * 0)) IN ([b7699 \in 1..3 |-> 1])[IF TRUE THEN b7698 ELSE 0] :> ((Head(<<>>) + (1 % 7)) \in ((7 \div 3) .. (2 * 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04950 failed.
    In applying the function
    <<1, 1, 1>>,
    the first argument is:
    8
    which is not in its domain.
---*)
