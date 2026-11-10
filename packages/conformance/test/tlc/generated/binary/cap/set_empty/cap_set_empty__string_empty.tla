(*---
description: cap of set_empty, a SetEnumValue, and string_empty, a StringValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (""))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
