(*---
description: Evaluates a random int expression, seed 262, number 4701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((Cardinality(2..1) .. (1 \div 2)) = ((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) \cap {3, 0})) THEN (([b7349 \in 2..1 |-> -1])[(0 - 2)] - ((0 :> 3))[(2147483647 - [a |-> 1])]) ELSE (((7 \div 3) :> (7 - 0)))[(\E b7350 \in (TRUE <=> FALSE) : (FALSE /\ TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04701 failed.
    Attempted to check if the value:
    3
    is an element of the function <<0, 0>>
---*)
