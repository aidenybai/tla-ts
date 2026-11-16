(*---
description: colon_greater of set_filter, a SetPredValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_filter__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> FALSE)"
---*)
