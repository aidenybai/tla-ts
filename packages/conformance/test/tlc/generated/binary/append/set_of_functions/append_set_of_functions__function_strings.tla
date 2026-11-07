(*---
description: append of set_of_functions, a SetOfFcnsValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_set_of_functions__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([{1} -> {2, 3}], [x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<2>>, <<3>>}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {<<2>>, <<3>>}
---*)
