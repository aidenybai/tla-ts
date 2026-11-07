(*---
description: Evaluates a random seq expression, seed 262, number 4327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(((FALSE => 3) \/ ({1, 2} \subseteq {})), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
---*)
