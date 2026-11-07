(*---
description: concat of string_empty, a StringValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\"b\\c\n"'
---*)
