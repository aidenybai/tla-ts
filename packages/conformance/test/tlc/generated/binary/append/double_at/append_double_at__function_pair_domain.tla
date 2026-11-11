(*---
description: append of double_at, a FcnRcdValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), [x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, (<<1, 2>> :> 3)>>"
---*)
