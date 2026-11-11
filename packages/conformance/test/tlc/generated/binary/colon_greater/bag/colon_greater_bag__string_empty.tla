(*---
description: colon_greater of bag, a FcnRcdValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<1>> :> "")'
---*)
