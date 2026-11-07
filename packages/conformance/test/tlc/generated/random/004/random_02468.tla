(*---
description: Evaluates a random seq expression, seed 262, number 2468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(SelectSeq(SubSeq(Nat, TRUE, 0), LAMBDA e : e > 0)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    Nat
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    Nat
---*)
