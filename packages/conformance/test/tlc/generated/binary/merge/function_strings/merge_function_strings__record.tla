(*---
description: merge of function_strings, a FcnRcdValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_strings__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) @@ ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> "a", b |-> "b"]'
---*)
