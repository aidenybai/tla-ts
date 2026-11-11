(*---
description: colon_greater of double_at, a FcnRcdValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_double_at__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) :> ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 3>> :> <<2, 4>>)"
---*)
