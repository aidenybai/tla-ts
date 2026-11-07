(*---
description: append of tuple, a TupleValue, and model_value, a ModelValue.
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
---- MODULE append_tuple__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append(<<1, 2>>, mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, mv>>"
---*)
