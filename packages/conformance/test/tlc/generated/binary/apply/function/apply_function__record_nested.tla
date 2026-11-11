(*---
description: apply of function, a FcnRcdValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2])[[a |-> [b |-> <<1>>]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function__record_nested failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> [b |-> <<1>>]]
---*)
