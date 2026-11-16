(*---
description: append of function, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE append_function__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append([x \in {1, 2} |-> x * 2], mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, mv>>"
---*)
