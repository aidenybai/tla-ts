(*---
description: diff of set_nested, a SetEnumValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_nested__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \ ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_nested__function_strings failed.
    Attempted to check if the value:
    {1}
    is an element of the function [a |-> "a", b |-> "b"]
---*)
