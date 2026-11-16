(*---
description: record_set of set_empty, a SetEnumValue, and string_empty, a StringValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : ("")])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
