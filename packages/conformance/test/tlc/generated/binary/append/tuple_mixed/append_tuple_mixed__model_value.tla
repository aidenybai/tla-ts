(*---
description: append of tuple_mixed, a TupleValue, and model_value, a ModelValue.
ref: tlc2/module/Sequences.java#Append
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
---- MODULE append_tuple_mixed__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append(<<1, "a", {TRUE}>>, mv))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, mv>>'
---*)
