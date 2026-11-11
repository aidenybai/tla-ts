(*---
description: subseteq of function, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE subseteq_function__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {1, 2} |-> x * 2]) \subseteq (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subseteq_function__model_value failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 17, col 16 to line 17, col 56 of module subseteq_function__model_value
---*)
