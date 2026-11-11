(*---
description: apply_argument applied to record_nested, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_argument_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} |-> e][[a |-> [b |-> <<1>>]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_argument_record_nested failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> [b |-> <<1>>]]
---*)
