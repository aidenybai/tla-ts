(*---
description: merge of string_empty, a StringValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_string_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") @@ (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    ""
    2169:0 The first argument of @@ should be a function, but instead it is:
    ""
---*)
