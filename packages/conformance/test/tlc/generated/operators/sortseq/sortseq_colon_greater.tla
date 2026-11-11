(*---
description: sortseq applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(1 :> 2, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
