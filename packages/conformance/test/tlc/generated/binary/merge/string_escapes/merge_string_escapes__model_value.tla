(*---
description: merge of string_escapes, a StringValue, and model_value, a ModelValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE merge_string_escapes__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(("a\"b\\c\n") @@ (mv))
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
