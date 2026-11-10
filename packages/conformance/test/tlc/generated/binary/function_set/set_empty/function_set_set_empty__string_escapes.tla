(*---
description: function_set of set_empty, a SetEnumValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_set_empty__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({}) -> ("a\"b\\c\n")])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
