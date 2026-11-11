(*---
description: colon_greater of record_nested, a RecordValue, and set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_record_nested__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) :> ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> [b |-> <<1>>]] :> {1, 2})"
---*)
