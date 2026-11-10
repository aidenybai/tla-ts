(*---
description: append of double_at, a FcnRcdValue, and set_cap, a SetCapValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), {1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, {2}>>"
---*)
