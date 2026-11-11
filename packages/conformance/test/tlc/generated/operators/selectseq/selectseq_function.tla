(*---
description: selectseq applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([x \in {1, 2} |-> x * 2], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4>>"
---*)
