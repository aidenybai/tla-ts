(*---
description: Evaluates a random seq expression, seed 262, number 3627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(Tail(SubSeq(<<1>>, 7, -1)), (IF TRUE THEN 7 ELSE 2147483647 \div LET b5732 == 7 IN [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
