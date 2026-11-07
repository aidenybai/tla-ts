(*---
description: colon_greater of tuple_empty, a TupleValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> Nat)"
---*)
