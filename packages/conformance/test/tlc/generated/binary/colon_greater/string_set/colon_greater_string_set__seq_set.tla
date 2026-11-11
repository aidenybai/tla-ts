(*---
description: colon_greater of string_set, a UserValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> Seq({1}))"
---*)
