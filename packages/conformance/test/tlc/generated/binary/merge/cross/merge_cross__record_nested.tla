(*---
description: merge of cross, a SetOfTuplesValue, and record_nested, a RecordValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_cross__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) @@ ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_cross__record_nested failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
