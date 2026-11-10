(*---
description: colon_greater of model_value, a ModelValue, and tuple_empty, a TupleValue.
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
---- MODULE colon_greater_model_value__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (mv :> <<>>)"
---*)
