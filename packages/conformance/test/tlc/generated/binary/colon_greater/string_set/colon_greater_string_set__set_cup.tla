(*---
description: colon_greater of string_set, a UserValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> {1, 2})"
---*)
