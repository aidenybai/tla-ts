(*---
description: Evaluates a random record expression, seed 262, number 546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (-Len(SelectSeq(1, LAMBDA e : e > 0)))])
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
