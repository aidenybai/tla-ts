(*---
description: "Sets of different size sort without comparing elements."
ref: "tlc2/value/impl/SetEnumValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE set_size_hides_incomparable ----
EXTENDS Integers, FiniteSets
Test == Cardinality({{1}, {"a", "b"}}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
