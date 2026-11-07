(*---
description: colon_greater of function_pair_domain, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_function_pair_domain__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ((<<1, 2>> :> 3) :> mv)"
---*)
