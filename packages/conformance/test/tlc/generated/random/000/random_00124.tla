(*---
description: Evaluates a random seq expression, seed 262, number 124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Tail(SelectSeq((-1 :> 7), LAMBDA e : e > 0)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (-1 :> 7)
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (-1 :> 7)
---*)
