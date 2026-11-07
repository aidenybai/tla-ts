(*---
description: Evaluates a random set expression, seed 262, number 576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail(SubSeq(7, 2, 1)), LAMBDA e : e > 0) EXCEPT ![1] = LET b974 == ((TRUE \/ FALSE) + Len(<<>>)) IN (CASE TRUE -> {x \in 1..3 : x > 1} [] OTHER -> b974 \div (b974 * b974))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    7
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    7
---*)
