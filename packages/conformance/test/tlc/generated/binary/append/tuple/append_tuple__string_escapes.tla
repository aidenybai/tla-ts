(*---
description: append of tuple, a TupleValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, "a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, 2, "a\"b\\c\n">>'
---*)
