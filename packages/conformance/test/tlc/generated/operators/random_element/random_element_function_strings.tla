(*---
description: random_element applied to function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [a |-> "a", b |-> "b"]
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    [a |-> "a", b |-> "b"]
---*)
