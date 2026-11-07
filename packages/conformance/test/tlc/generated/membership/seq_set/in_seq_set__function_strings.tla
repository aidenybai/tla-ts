(*---
description: Asks whether function_strings is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> "a", b |-> "b"]
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    [a |-> "a", b |-> "b"]
    is an element of Seq({1}).
---*)
