(*---
description: concat of function_empty, a FcnRcdValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_empty__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \o ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
