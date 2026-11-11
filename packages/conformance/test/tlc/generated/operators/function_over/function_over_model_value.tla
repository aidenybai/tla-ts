(*---
description: function_over applied to model_value, a ModelValue.
ref: tlc2/value/impl/FcnLambdaValue.java
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
---- MODULE function_over_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT([e \in mv |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in mv |-> <expression line 17, col 30 to line 17, col 30 of module function_over_model_value>]"
---*)
