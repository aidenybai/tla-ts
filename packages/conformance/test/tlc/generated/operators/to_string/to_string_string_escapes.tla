(*---
description: to_string applied to string_escapes, a StringValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "\"a\\\"b\\\\c\\n\""'
---*)
