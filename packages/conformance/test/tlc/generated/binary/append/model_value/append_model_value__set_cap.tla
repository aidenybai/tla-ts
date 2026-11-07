(*---
description: append of model_value, a ModelValue, and set_cap, a SetCapValue.
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
---- MODULE append_model_value__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append(mv, {1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    mv
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    mv
---*)
