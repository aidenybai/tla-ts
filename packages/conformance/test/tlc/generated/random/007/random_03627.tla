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
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03627 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
