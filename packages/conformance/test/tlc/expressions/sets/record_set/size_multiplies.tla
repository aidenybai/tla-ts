(*---
description: "Cardinality multiplies the field sizes without enumerating."
ref: "tlc2/value/impl/SetOfRcdsValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE size_multiplies ----
EXTENDS Integers, FiniteSets
Test == Cardinality([a : 1..30000, b : 1..30000]) = 900000000
====

(*--- recorded
all:
  exit: 0
---*)
