(*---
description: colon_greater of model_value, a ModelValue, and int_negative, a IntValue.
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
---- MODULE colon_greater_model_value__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> -3)"
---*)
