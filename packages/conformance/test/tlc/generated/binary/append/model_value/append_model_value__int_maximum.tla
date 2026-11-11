(*---
description: append of model_value, a ModelValue, and int_maximum, a IntValue.
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
---- MODULE append_model_value__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append(mv, 2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module append_model_value__int_maximum failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    mv
---*)
