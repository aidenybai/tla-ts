(*---
description: merge of true, a BoolValue, and string_escapes, a StringValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_true__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) @@ ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
---*)
