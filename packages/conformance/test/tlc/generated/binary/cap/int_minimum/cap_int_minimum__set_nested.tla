(*---
description: cap of int_minimum, a IntValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_minimum__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \cap ({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_int_minimum__set_nested failed.
    Attempted to check if the value:
    {1}
    is an element of the integer -2147483648
---*)
