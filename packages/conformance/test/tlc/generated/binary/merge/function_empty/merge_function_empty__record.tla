(*---
description: merge of function_empty, a FcnRcdValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_empty__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) @@ ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> 2]"
---*)
