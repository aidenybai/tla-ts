(*---
description: append of double_at, a FcnRcdValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, Seq({1})>>"
---*)
