(*---
description: colon_greater of int_one, a IntValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3>>"
---*)
