(*---
description: selectseq applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(1 :> 2, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
