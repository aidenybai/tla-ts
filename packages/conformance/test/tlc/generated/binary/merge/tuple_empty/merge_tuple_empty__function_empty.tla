(*---
description: merge of tuple_empty, a TupleValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_tuple_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) @@ ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
