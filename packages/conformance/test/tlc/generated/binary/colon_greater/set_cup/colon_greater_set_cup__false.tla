(*---
description: colon_greater of set_cup, a SetCupValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cup__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> FALSE)"
---*)
