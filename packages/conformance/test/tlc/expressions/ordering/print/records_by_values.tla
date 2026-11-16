(*---
description: "Records with equal names sort by values."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE records_by_values ----
EXTENDS Integers, TLC
Test == PrintT({[zw |-> 2], [zw |-> 1]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[zw |-> 1], [zw |-> 2]}"
---*)
