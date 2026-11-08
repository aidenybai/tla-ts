(*---
description: Evaluates a random set expression, seed 262, number 70.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((\E b101 \in {1, 3} : (b101 \in {})) \cap ((7 % -1) .. Head(<<1, 2>>))), (({b102 \in {} : TRUE} \cup {2147483647, 1}) \ {b103 \in {7 : b104 \in 1} : (-1 = 2147483647)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00070 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
