(*---
description: cup of string_escapes, a StringValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_string_escapes__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\"b\\c\n"'
---*)
