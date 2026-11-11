(*---
description: apply of string_set, a UserValue, and model_value, a ModelValue.
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
---- MODULE apply_string_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((STRING)[mv])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module apply_string_set__model_value failed.
    A non-function (a special set constant) was applied as a function.
    line 17, col 16 to line 17, col 27 of module apply_string_set__model_value
---*)
