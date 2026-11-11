(*---
description: colon_greater of record_nested, a RecordValue, and int_one, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_record_nested__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) :> (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> [b |-> <<1>>]] :> 1)"
---*)
