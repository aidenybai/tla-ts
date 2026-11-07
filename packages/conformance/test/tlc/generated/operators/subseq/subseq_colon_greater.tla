(*---
description: subseq applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(1 :> 2, 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
