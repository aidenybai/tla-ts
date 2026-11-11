(*---
description: merge of int_maximum, a IntValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_maximum__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) @@ ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_int_maximum__string_escapes failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
---*)
