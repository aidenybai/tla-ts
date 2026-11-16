(*---
description: apply of set_of_records, a SetOfRcdsValue, and record, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_set_of_records__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}])[[a |-> 1, b |-> 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_set_of_records__record failed.
    A non-function (a set of the form [d1 : S1, ... , dN : SN]) was applied as a function.
    line 14, col 16 to line 14, col 49 of module apply_set_of_records__record
---*)
