(*---
description: colon_greater of boolean_set, a SetEnumValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_boolean_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((BOOLEAN) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> mv)"
---*)
