(*---
description: colon_greater of model_value, a ModelValue, and set_cup, a SetCupValue.
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
---- MODULE colon_greater_model_value__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> {1, 2})"
---*)
