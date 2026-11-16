(*---
description: concat of string_a, a StringValue, and string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_a__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") \o ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "aa\"b\\c\n"'
---*)
