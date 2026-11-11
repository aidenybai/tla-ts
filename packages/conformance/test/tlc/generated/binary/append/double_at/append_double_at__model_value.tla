(*---
description: append of double_at, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE append_double_at__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, mv>>"
---*)
