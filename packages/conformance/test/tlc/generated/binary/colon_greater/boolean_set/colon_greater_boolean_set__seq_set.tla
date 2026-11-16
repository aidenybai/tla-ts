(*---
description: colon_greater of boolean_set, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> Seq({1}))"
---*)
