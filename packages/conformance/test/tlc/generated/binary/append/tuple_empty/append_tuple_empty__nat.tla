(*---
description: append of tuple_empty, a TupleValue, and nat, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<Nat>>"
---*)
