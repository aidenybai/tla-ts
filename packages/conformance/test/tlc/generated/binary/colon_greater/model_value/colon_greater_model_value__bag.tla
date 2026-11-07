(*---
description: colon_greater of model_value, a ModelValue, and bag, a FcnRcdValue.
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
---- MODULE colon_greater_model_value__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> <<1>>)"
---*)
