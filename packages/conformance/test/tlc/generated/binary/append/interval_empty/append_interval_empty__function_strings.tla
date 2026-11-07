(*---
description: append of interval_empty, a IntervalValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_interval_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(3..1, [x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
---*)
