(*---
description: apply_argument applied to record, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_argument_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} |-> e][[a |-> 1, b |-> 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_argument_record failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> 2]
---*)
