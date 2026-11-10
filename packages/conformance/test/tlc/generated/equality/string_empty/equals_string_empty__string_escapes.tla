(*---
description: Compares string_empty, a StringValue, with string_escapes, a StringValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") = ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
