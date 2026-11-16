(*---
description: colon_greater of function_lazy, a FcnLambdaValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_function_lazy__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in Nat |-> x]) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([x \\in Nat |-> <expression line 17, col 32 to line 17, col 32 of module colon_greater_function_lazy__model_value>] :> mv)"
---*)
