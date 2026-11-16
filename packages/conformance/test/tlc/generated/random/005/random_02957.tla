(*---
description: Evaluates a random seq expression, seed 262, number 2957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(Append([<<>> EXCEPT ![1] = 1], [[x \in Nat |-> x + 1] EXCEPT ![FALSE] = 2147483647]), LET b4688 == (0 \div 0) IN (b4688 \div FALSE), Len(<<2, 7>>)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 41 to line 14, col 44 of module random_02957
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02957 failed.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of Nat.
---*)
