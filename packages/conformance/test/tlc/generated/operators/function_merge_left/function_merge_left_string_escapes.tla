(*---
description: function_merge_left applied to string_escapes, a StringValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a\"b\\c\n" @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    "a\"b\\c\n"
    2169:0 The first argument of @@ should be a function, but instead it is:
    "a\"b\\c\n"
---*)
