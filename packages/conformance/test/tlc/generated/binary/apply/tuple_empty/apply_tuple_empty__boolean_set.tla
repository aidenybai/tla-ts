(*---
description: apply of tuple_empty, a TupleValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>)[BOOLEAN])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_tuple_empty__boolean_set failed.
    Attempted to access tuple at a non integral index: {FALSE, TRUE}
---*)
