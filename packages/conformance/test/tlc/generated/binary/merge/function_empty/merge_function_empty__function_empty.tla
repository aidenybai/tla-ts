(*---
description: merge of function_empty, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) @@ ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
