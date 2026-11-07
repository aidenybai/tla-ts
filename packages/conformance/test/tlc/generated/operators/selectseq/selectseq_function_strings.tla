(*---
description: selectseq applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([x \in {"a", "b"} |-> x], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> "a", b |-> "b"]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
