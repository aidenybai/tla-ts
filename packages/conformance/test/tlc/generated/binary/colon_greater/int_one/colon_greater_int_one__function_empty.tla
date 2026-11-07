(*---
description: colon_greater of int_one, a IntValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<>>>>"
---*)
