(*---
description: Compares nat, a UserValue, with string_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_nat__string_set failed.
    2155:0 Attempted to compare Nat with the value
    STRING
---*)
