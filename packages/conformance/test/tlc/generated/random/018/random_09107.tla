(*---
description: Evaluates a random seq expression, seed 262, number 9107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SubSeq([<<>> EXCEPT ![1] = 7], (3 - 7), (-7)), ((1 * 0) \div LET b14154 == 3 IN b14154)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_09107
    | <<0>>
---*)
