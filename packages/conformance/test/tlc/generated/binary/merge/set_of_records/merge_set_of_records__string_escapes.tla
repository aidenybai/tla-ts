(*---
description: merge of set_of_records, a SetOfRcdsValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_of_records__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) @@ ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
