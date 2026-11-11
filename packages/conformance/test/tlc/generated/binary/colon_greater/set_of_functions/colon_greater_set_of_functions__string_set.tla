(*---
description: colon_greater of set_of_functions, a SetOfFcnsValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_functions__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<2>>, <<3>>} :> STRING)"
---*)
