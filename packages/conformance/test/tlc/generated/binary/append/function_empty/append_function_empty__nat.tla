(*---
description: append of function_empty, a FcnRcdValue, and nat, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<Nat>>"
---*)
