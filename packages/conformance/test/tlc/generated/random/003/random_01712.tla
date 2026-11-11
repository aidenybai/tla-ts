(*---
description: Evaluates a random record expression, seed 262, number 1712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = 2147483647] \subseteq {Len(<<>>) : b2727 \in ([a |-> 1] \in 0)}) => (({b2728 \in {1} : FALSE} \cap (1..3 \cup 1..3)) = ({2147483647, 1} \cup {b2729 : b2729 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01712 failed.
    Attempted to check if the value:
    [a |-> 1]
    is an element of the integer 0
---*)
