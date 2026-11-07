(*---
description: Evaluates a random function expression, seed 262, number 2333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3693 \in (SortSeq(SortSeq([a |-> 1, b |-> TRUE], LAMBDA p, q : p < q), LAMBDA p, q : p < q) \cap (~({} = {x \in 1..3 : x > 1}))) |-> ((([a |-> 1] = 3) * (CHOOSE b3694 \in {} : TRUE)) % ((2147483647 :> b3693))[(CHOOSE b3695 \in 2..1 : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
