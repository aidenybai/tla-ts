(*---
description: Compares false, a BoolValue, with string_set, a UserValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_false__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) = (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_false__string_set failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    STRING
---*)
