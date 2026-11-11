(*---
description: colon_greater of colon_greater, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> <<>>)"
---*)
