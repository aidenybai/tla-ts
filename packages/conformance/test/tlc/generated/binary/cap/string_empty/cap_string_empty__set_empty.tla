(*---
description: cap of string_empty, a StringValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_string_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
