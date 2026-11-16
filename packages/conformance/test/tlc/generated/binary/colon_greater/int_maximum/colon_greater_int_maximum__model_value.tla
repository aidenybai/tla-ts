(*---
description: colon_greater of int_maximum, a IntValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_int_maximum__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((2147483647) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2147483647 :> mv)"
---*)
