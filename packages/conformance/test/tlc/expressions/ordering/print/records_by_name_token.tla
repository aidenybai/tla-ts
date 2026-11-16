(*---
description: "Records of equal size sort by field token before values."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE records_by_name_token ----
EXTENDS Integers, TLC
Test == PrintT({[zy |-> 9], [zx |-> 0]})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[zy |-> 9], [zx |-> 0]}"
---*)
