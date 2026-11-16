(*---
description: cup of string_escapes, a StringValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_string_escapes__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a\"b\\c\n"'
---*)
