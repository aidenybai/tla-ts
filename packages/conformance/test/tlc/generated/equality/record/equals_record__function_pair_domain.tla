(*---
description: Compares record, a RecordValue, with function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/RecordValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_record__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) = ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_record__function_pair_domain failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> 2]
    with non-record
    (<<1, 2>> :> 3)
---*)
