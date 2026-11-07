(*---
description: Evaluates a random set expression, seed 262, number 454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 + 2147483647) < (2147483647 % -1)) .. Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) \cap {Head([<<1>> EXCEPT ![1] = 0]), (CHOOSE b749 \in ([a |-> 1, b |-> TRUE] \cup {x \in 1..3 : x > 1}) : (TRUE <=> TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
