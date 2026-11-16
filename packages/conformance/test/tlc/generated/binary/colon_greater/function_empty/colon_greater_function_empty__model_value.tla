(*---
description: colon_greater of function_empty, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_function_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {} |-> x]) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> mv)"
---*)
