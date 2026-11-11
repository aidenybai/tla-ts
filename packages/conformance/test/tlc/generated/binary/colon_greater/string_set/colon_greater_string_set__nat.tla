(*---
description: colon_greater of string_set, a UserValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> Nat)"
---*)
