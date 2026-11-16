(*---
description: colon_greater of colon_greater, a FcnRcdValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> STRING)"
---*)
