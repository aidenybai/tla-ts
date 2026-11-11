(*---
description: cap of record_nested, a RecordValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_record_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \cap (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_record_nested__boolean_set failed.
    Attempted to check if element:
    FALSE
    is in the record:
    [a |-> [b |-> <<1>>]]
---*)
