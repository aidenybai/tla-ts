(*---
description: colon_greater of model_value, a ModelValue, and true, a BoolValue.
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
---- MODULE colon_greater_model_value__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> TRUE)"
---*)
