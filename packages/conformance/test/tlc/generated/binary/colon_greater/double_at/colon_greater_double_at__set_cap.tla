(*---
description: colon_greater of double_at, a FcnRcdValue, and set_cap, a SetCapValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_double_at__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) :> ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 3>> :> {2})"
---*)
