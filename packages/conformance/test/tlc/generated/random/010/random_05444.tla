(*---
description: Evaluates a random seq expression, seed 262, number 5444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (-(-3)), Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))) EXCEPT ![1] = Head(SelectSeq((Nat \cup 2..1), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 148 of module random_05444
    | <<>>
---*)
