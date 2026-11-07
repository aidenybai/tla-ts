(*---
description: sortseq applied to function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([x \in {"a", "b"} |-> x], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> "a", b |-> "b"]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
