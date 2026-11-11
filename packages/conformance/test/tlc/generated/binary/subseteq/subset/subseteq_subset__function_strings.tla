(*---
description: subseteq of subset, a SubsetValue, and function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_subset__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \subseteq ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_subset__function_strings failed.
    Attempted to check if the value:
    {}
    is an element of the function [a |-> "a", b |-> "b"]
---*)
