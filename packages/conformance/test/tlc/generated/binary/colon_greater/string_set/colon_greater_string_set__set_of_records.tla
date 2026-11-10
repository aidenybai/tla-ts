(*---
description: colon_greater of string_set, a UserValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> {[a |-> 1], [a |-> 2]})"
---*)
