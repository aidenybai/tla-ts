(*---
description: concat of tuple_mixed, a TupleValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple_mixed__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) \o ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1, b |-> 2]
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1, b |-> 2]
---*)
