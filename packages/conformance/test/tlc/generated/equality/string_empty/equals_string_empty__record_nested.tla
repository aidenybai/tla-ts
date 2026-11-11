(*---
description: Compares string_empty, a StringValue, with record_nested, a RecordValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") = ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_empty__record_nested failed.
    Attempted to check equality of string "" with non-string:
    [a |-> [b |-> <<1>>]]
---*)
