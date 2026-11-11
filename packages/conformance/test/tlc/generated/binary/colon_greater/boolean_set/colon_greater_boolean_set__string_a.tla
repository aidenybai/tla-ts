(*---
description: colon_greater of boolean_set, a SetEnumValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({FALSE, TRUE} :> "a")'
---*)
