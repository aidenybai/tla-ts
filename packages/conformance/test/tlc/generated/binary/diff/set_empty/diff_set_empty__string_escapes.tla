(*---
description: diff of set_empty, a SetEnumValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
