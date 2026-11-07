(*---
description: colon_greater of false, a BoolValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> {<<2>>, <<3>>})"
---*)
