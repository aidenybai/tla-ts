(*---
description: Evaluates a random seq expression, seed 262, number 2506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b3946 \in (CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) |-> ((b3946 .. b3946) \div (-3))] EXCEPT ![1] = Len([<<2, 2147483647>> EXCEPT ![1] = Cardinality([x \in Nat |-> x + 1])])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02506 failed.
    Attempted to check if the value:
    1
    is an element of the function <<1, 1, 1>>
---*)
