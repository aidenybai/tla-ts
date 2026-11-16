(*---
description: colon_greater of set_of_functions, a SetOfFcnsValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_functions__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<2>>, <<3>>} :> {FALSE, TRUE})"
---*)
