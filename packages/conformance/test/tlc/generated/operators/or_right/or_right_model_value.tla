(*---
description: or_right applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
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
---- MODULE or_right_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(FALSE \/ mv)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module or_right_model_value failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a model value.
    line 17, col 16 to line 17, col 26 of module or_right_model_value
---*)
