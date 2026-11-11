(*---
description: len applied to string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 6"
---*)
