(*---
description: subseteq of bag, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_bag__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \subseteq ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_bag__function_empty failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 59 of module subseteq_bag__function_empty
---*)
