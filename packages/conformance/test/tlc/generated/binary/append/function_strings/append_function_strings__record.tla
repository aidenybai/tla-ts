(*---
description: append of function_strings, a FcnRcdValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_strings__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {"a", "b"} |-> x], [a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> "a", b |-> "b"]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> "a", b |-> "b"]
---*)
