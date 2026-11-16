(*---
description: Evaluates a random seq expression, seed 262, number 7799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = Head(2)], LAMBDA p, q : p < q) EXCEPT ![1] = ([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + Head(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 59 of module random_07799
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 104 of module random_07799
    | <<>>
---*)
