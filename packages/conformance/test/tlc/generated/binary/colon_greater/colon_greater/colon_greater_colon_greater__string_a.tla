(*---
description: colon_greater of colon_greater, a FcnRcdValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<2>> :> "a")'
---*)
