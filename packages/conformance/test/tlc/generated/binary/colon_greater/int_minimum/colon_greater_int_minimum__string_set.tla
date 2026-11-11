(*---
description: colon_greater of int_minimum, a IntValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> STRING)"
---*)
