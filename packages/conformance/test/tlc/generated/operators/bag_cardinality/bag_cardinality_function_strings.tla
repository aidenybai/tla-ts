(*---
description: bag_cardinality applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    [a |-> "a", b |-> "b"]
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    [a |-> "a", b |-> "b"]
---*)
