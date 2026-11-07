(*---
description: Evaluates a random seq expression, seed 262, number 8336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(<<([a |-> 1, b |-> TRUE]).a, (0 * 3)>> \o SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)) EXCEPT ![1] = (((1 :> 7) @@ (2147483647 :> 7)))[(Head(<<1, 2>>) + (7 % -1))]])
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
