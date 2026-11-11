(*---
description: subseq applied to double_at, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((1 :> 2) @@ (2 :> 3), 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
