(*---
description: append of double_at, a FcnRcdValue, and int_zero, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, 0>>"
---*)
