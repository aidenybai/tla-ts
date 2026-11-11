(*---
description: subseteq of model_value, a ModelValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
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
---- MODULE subseteq_model_value__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \subseteq ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subseteq_model_value__set_of_functions failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 17, col 16 to line 17, col 47 of module subseteq_model_value__set_of_functions
---*)
