(*---
description: colon_greater of int, a UserValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_int__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((Int) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> mv)"
---*)
