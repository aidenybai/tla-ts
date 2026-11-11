(*---
description: apply of boolean_set, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
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
---- MODULE apply_boolean_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((BOOLEAN)[mv])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module apply_boolean_set__model_value failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 17, col 16 to line 17, col 28 of module apply_boolean_set__model_value
---*)
