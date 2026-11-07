(*---
description: Evaluates a random seq expression, seed 262, number 4129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(((7 \in 1..3) => ({2, 1, 3} \subseteq {1, 2}))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
