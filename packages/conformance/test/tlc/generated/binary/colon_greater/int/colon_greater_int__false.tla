(*---
description: colon_greater of int, a UserValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> FALSE)"
---*)
