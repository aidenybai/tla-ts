(*---
description: cap of function_strings, a FcnRcdValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_strings__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \cap ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_function_strings__set_cup failed.
    Attempted to check if the value:
    1
    is an element of the function [a |-> "a", b |-> "b"]
---*)
