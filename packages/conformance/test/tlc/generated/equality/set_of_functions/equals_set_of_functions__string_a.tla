(*---
description: Compares set_of_functions, a SetOfFcnsValue, with string_a, a StringValue.
ref: tlc2/value/impl/SetOfFcnsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_functions__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) = ("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_of_functions__string_a failed.
    Attempted to check equality of the set {<<2>>, <<3>>} with the value:
    "a"
---*)
