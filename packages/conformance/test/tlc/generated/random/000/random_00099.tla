(*---
description: Evaluates a random seq expression, seed 262, number 99.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), IF FALSE THEN 3 ELSE 3, (-1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
