(*---
description: concat of string_escapes, a StringValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_escapes__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \o ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\"b\\c\na"'
---*)
