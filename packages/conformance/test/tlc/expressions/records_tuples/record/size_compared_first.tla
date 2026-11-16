(*---
description: "Records with different numbers of fields differ before values are compared."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE size_compared_first ----
EXTENDS Integers
Test == [a |-> "x"] # [a |-> 1, b |-> 2]
====

(*--- recorded
all:
  exit: 0
---*)
