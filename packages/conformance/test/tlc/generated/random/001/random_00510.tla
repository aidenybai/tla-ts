(*---
description: Evaluates a random int expression, seed 262, number 510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b848 \in (([b849 \in {1, 2} |-> 2])[LET b850 == 3 IN b850] .. [a |-> Len(<<3, 1, 2>>), b |-> (FALSE \/ TRUE)]) : (~((2 \in {1}) => ({2, 1, 3} \subseteq [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00510 failed.
    In applying the function
    <<2, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
