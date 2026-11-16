(*---
description: colon_greater of function_empty, a FcnRcdValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> Nat)"
---*)
