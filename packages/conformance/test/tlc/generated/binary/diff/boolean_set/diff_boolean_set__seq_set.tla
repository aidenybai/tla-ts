(*---
description: diff of boolean_set, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_boolean_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \ (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_boolean_set__seq_set failed.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of Seq({1}).
---*)
