(*---
description: Evaluates a random bool expression, seed 262, number 8190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([b12661 \in {1} |-> 1])[(3 * 3)]) \in ({IF SUBSET {1} THEN 7 ELSE 2147483647 : b12662 \in {b12663 : b12663 \in {x \in 1..3 : x > 1}}} \cap ({b12664 : b12664 \in {1, 2}} \ (0 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08190 failed.
    In applying the function
    <<1>>,
    the first argument is:
    9
    which is not in its domain.
---*)
