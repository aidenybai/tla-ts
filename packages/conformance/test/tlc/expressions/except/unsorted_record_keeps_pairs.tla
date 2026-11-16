(*---
description: "EXCEPT on a record with unsorted fields keeps each name with its value."
ref: "tlc2/value/impl/RecordValue.java#snapshot"
flags: [expression]
outcome: success
---*)
---- MODULE unsorted_record_keeps_pairs ----
EXTENDS Integers
Test == [[zb |-> 1, za |-> 2] EXCEPT !.za = 3] = [za |-> 3, zb |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
