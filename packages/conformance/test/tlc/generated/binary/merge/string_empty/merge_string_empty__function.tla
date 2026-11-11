(*---
description: merge of string_empty, a StringValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_string_empty__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") @@ ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_string_empty__function failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    ""
---*)
