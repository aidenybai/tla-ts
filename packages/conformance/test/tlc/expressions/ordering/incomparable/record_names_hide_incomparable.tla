(*---
description: "Records with different names sort without comparing values."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE record_names_hide_incomparable ----
EXTENDS Integers, FiniteSets
Test == Cardinality({[a |-> 1], [b |-> "x"]}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
