(*---
description: Evaluates a random record expression, seed 262, number 9963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([b15490 \in ({1, 2} \cup {x \in 1..3 : x > 1}) |-> (-b15490)])[(IF TRUE THEN 1 ELSE <<3, 1, 2>> % (1 % 1))], b |-> (Head((2147483647 - 3)) = (Len(<<1>>) + Cardinality({1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09963 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483644
---*)
