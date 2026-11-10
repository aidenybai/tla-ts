(*---
description: "\\cup of enumerated sets keeps one copy of a shared element."
ref: "tlc2/value/impl/SetEnumValue.java#cup"
flags: [expression]
outcome: success
---*)
---- MODULE cup_enum_dedupes ----
EXTENDS Integers, FiniteSets
Test == Cardinality({1, 2} \cup {2, 3}) = 3
====

(*--- recorded
all:
  exit: 0
---*)
