(*---
description: Evaluates a random seq expression, seed 262, number 8531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(Append([<<>> EXCEPT ![1] = 1], CASE FALSE -> 2147483647 [] OTHER -> 2147483647), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 42 to line 14, col 45 of module random_08531
    | <<2147483647>>
---*)
