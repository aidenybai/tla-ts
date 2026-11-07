(*---
description: colon_greater of boolean_set, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> <<>>)"
---*)
