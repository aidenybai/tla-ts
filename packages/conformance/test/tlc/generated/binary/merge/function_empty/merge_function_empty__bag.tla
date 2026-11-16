(*---
description: merge of function_empty, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) @@ (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
