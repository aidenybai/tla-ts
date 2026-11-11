(*---
description: Evaluates a random bool expression, seed 262, number 6642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({x \in 1..3 : x > 1} \ Nat) \cup DOMAIN [x \in 1..2 |-> x]) = (({x \in 1..3 : x > 1} \cap SUBSET {1}) \cap (SUBSET {1} \ {}))) => (((CHOOSE f \in [1..2 -> 2..1] : TRUE))[LET b10192 == 2147483647 IN b10192] = (Head(<<3, 1, 2>>) \div ((1 :> 2)).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06642 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
