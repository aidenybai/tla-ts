(*---
description: colon_greater of function_empty, a FcnRcdValue, and record_nested, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> [a |-> [b |-> <<1>>]])"
---*)
