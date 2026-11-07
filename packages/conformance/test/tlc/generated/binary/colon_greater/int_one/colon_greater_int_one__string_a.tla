(*---
description: colon_greater of int_one, a IntValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"a">>'
---*)
