(*---
description: subseteq of model_value, a ModelValue, and union, a UnionValue.
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
---- MODULE subseteq_model_value__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \subseteq (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module subseteq_model_value__union failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 17, col 16 to line 17, col 48 of module subseteq_model_value__union
---*)
