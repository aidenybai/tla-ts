(*---
description: "Records with reordered fields are equal."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE field_order_irrelevant ----
EXTENDS Integers
Test == [za |-> 1, zb |-> 2] = [zb |-> 2, za |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
