(*---
description: colon_greater of function_empty, a FcnRcdValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> Seq({1}))"
---*)
