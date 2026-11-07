(*---
description: Evaluates a random seq expression, seed 262, number 8752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(SubSeq(Append([x \in 1..2 |-> x], 3), Head(2147483647), Len(<<>>)), (([x \in Nat |-> x + 1])[3] - ([a |-> 1, b |-> TRUE]).a), LET b13551 == ((1 :> 2))[-1] IN IF TRUE THEN 3 ELSE b13551), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483647
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483647
---*)
