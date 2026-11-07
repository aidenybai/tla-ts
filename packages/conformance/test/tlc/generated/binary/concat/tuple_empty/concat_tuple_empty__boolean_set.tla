(*---
description: concat of tuple_empty, a TupleValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) \o (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {FALSE, TRUE}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {FALSE, TRUE}
---*)
