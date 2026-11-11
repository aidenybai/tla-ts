(*---
description: colon_greater of string_set, a UserValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> <<>>)"
---*)
