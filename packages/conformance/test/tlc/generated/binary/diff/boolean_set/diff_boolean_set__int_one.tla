(*---
description: diff of boolean_set, a SetEnumValue, and int_one, a IntValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_boolean_set__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \ (1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_boolean_set__int_one failed.
    Attempted to check if the value:
    FALSE
    is an element of the integer 1
---*)
