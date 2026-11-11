(*---
description: Compares boolean_set, a SetEnumValue, with string_a, a StringValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_boolean_set__string_a failed.
    Attempted to check equality of the set {FALSE, TRUE} with the value:
    "a"
---*)
