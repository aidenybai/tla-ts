(*---
description: merge of record_nested, a RecordValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_record_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) @@ (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
---*)
