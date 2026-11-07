(*---
description: colon_greater of model_value, a ModelValue, and set_diff, a SetDiffValue.
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
---- MODULE colon_greater_model_value__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> {1})"
---*)
