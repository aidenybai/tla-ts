(*---
description: "Records sort by number of fields first."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE records_by_size ----
EXTENDS Integers, TLC
Test == PrintT({[zt |-> 1, zu |-> 1], [zv |-> 0]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[zv |-> 0], [zt |-> 1, zu |-> 1]}"
---*)
