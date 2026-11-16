(*---
description: colon_greater of function, a FcnRcdValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 4>> :> Nat)"
---*)
