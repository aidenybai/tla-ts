(*---
description: Evaluates a random seq expression, seed 262, number 5855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = ((7 * 3) \div IF TRUE THEN -1 ELSE 7)] \o [[[<<>> EXCEPT ![1] = 3] EXCEPT ![1] = (7 :> 0)] EXCEPT ![1] = (LET b9038 == 2 IN b9038 % (-3))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 142 to line 14, col 145 of module random_05855
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 141 to line 14, col 162 of module random_05855
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 140 to line 14, col 186 of module random_05855
    | <<-21>>
---*)
