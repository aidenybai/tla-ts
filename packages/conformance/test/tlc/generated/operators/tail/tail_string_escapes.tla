(*---
description: tail applied to string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "\"b\\c\n"'
---*)
