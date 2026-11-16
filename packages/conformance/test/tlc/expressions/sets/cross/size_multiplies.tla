(*---
description: "Cardinality of a product is computed from its components without enumerating."
ref: "tlc2/value/impl/SetOfTuplesValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE size_multiplies ----
EXTENDS Integers, FiniteSets
Test == Cardinality((1..30000) \X (1..30000)) = 900000000
====

(*--- recorded
all:
  exit: 0
---*)
