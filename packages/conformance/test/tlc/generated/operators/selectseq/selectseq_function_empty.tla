(*---
description: selectseq applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([x \in {} |-> x], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
