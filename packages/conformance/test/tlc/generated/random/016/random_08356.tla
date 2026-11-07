(*---
description: Evaluates a random seq expression, seed 262, number 8356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SelectSeq(SelectSeq(SelectSeq(1, LAMBDA e : e > 0), LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    1
---*)
