(*---
description: merge of function_strings, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_strings__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) @@ (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
