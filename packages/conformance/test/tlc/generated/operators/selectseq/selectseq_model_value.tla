(*---
description: selectseq applied to model_value, a ModelValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE selectseq_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(SelectSeq(mv, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module selectseq_model_value failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    mv
---*)
