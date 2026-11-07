(*---
description: merge of record_nested, a RecordValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_record_nested__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) @@ ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> [b |-> <<1>>]]"
---*)
