(*---
description: Evaluates a random seq expression, seed 262, number 6664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<Len((Nat \cap FALSE)), Len(SubSeq(<<>>, -1, -1))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    Nat \cap FALSE
    2283:0 The argument of Len should be a sequence, but instead it is:
    Nat \cap FALSE
---*)
