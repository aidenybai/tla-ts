(*---
description: colon_greater of cross, a SetOfTuplesValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_cross__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) :> ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<1, 3>>, <<2, 3>>} :> [a |-> 1, b |-> 2])"
---*)
