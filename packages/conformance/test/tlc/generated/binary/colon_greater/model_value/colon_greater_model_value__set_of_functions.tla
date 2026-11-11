(*---
description: colon_greater of model_value, a ModelValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE colon_greater_model_value__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> {<<2>>, <<3>>})"
---*)
