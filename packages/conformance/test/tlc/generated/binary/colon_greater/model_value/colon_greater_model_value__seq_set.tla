(*---
description: colon_greater of model_value, a ModelValue, and seq_set, a UserValue.
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
---- MODULE colon_greater_model_value__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> Seq({1}))"
---*)
