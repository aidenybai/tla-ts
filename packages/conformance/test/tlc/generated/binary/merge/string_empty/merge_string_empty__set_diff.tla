(*---
description: merge of string_empty, a StringValue, and set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_string_empty__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") @@ ({1, 2} \ {2}))
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
