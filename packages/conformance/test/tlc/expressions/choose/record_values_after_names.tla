(*---
description: "Normalized order compares record values when the field names match."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE record_values_after_names ----
EXTENDS Integers
Test == (CHOOSE x \in {[zzh |-> 2], [zzh |-> 1]} : TRUE) = [zzh |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
