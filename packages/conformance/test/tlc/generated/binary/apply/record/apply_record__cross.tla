(*---
description: apply of record, a RecordValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_record__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2])[{1, 2} \X {3}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_record__cross failed.
    Attempted to access record by a non-string argument: {<<1, 3>>, <<2, 3>>}
---*)
