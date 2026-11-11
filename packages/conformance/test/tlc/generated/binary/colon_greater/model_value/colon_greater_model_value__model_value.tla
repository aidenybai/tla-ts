(*---
description: colon_greater of model_value, a ModelValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_model_value__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> mv)"
---*)
