(*---
description: Evaluates a random seq expression, seed 262, number 5168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-7)], Head(<<2147483647, FALSE>>), LET b8017 == CASE FALSE -> -1 [] OTHER -> -1 IN IF FALSE THEN FALSE ELSE 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
