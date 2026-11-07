(*---
description: Asks whether function_pair_domain is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    (<<1, 2>> :> 3)
    is an element of Seq({1}).
    2158:0 Attempted to check if the value:
    (<<1, 2>> :> 3)
    is an element of Seq({1}).
---*)
