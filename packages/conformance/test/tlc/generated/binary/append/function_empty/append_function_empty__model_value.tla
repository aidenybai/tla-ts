(*---
description: append of function_empty, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE append_function_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append([x \in {} |-> x], mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<mv>>"
---*)
