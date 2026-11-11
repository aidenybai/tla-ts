(*---
description: Evaluates a random seq expression, seed 262, number 1317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) \o SortSeq([<<>> EXCEPT ![1] = 0], LAMBDA p, q : p < q)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 104 to line 14, col 107 of module random_01317
    | <<1>>
---*)
