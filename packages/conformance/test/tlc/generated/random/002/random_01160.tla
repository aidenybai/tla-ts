(*---
description: Evaluates a random seq expression, seed 262, number 1160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SelectSeq([<<>> EXCEPT ![1] = 0], LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = ({(b1857 - 1) : b1857 \in {-1, -1}} < ((7 % -1) - (-1)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 39 of module random_01160
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 97 of module random_01160
    | <<>>
---*)
