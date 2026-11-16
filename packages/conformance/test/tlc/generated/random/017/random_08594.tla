(*---
description: Evaluates a random set expression, seed 262, number 8594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 :> 2))[({1, 2} \ {x \in 1..3 : x > 1})] .. Head([<<1>> EXCEPT ![1] = 7])) \ ((({1, 2} \cap SUBSET {1}) \cap {2147483647 : b13317 \in {2, 1, 3}}) \ ({3, <<1>>} \cup UNION {{1, 2}, {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08594 failed.
    Attempted to check equality of integer -1 with non-integer:
    {1}
---*)
