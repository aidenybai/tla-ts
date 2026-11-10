(*---
description: subseteq of boolean_set, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_boolean_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \subseteq ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_boolean_set__set_of_records failed.
    Attempted to check if non-record
    FALSE
    is in the set of records:
    {[a |-> 1], [a |-> 2]}
---*)
