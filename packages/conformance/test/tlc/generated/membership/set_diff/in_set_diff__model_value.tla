(*---
description: Asks whether model_value is in set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE in_set_diff__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \in ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
