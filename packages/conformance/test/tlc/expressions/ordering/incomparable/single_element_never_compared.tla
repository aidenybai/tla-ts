(*---
description: "A one-element set sorts without comparing."
ref: "tlc2/value/impl/ValueVec.java#sort"
flags: [expression]
outcome: success
---*)
---- MODULE single_element_never_compared ----
EXTENDS Integers, FiniteSets
Test == Cardinality({<<1, "a">>}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
