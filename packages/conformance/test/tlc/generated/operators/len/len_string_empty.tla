(*---
description: len applied to string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(""))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
