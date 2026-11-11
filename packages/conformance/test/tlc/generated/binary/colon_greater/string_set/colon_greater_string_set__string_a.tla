(*---
description: colon_greater of string_set, a UserValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (STRING :> "a")'
---*)
