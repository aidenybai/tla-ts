(*---
description: colon_greater of colon_greater, a FcnRcdValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> Nat)"
---*)
