(*---
description: len applied to string_a, a StringValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
