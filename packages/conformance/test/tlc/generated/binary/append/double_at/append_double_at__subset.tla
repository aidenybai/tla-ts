(*---
description: append of double_at, a FcnRcdValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, {{}, {1}, {2}, {1, 2}}>>"
---*)
