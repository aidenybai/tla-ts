(*---
description: colon_greater of set_of_functions, a SetOfFcnsValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_functions__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({<<2>>, <<3>>} :> "")'
---*)
