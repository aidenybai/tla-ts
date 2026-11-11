(*---
description: colon_greater of seq_set, a UserValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_seq_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((Seq({1})) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Seq({1}) :> mv)"
---*)
