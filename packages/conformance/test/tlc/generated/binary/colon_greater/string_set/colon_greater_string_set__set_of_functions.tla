(*---
description: colon_greater of string_set, a UserValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> {<<2>>, <<3>>})"
---*)
