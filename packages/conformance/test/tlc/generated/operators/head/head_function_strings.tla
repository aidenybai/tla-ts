(*---
description: head applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> "a", b |-> "b"]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
