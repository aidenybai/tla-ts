(*---
description: "Records with different field names differ before their values are compared."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE values_compared_after_names ----
EXTENDS Integers
Test == [a |-> "x"] # [b |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
