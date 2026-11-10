(*---
description: subseq applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([x \in {1, 2} |-> x * 2], 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
