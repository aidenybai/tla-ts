(*---
description: "Normalized order compares records by field count first."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE smaller_record_before_larger ----
EXTENDS Integers
Test == (CHOOSE x \in {[zzi |-> 1, zzj |-> 1], [zzk |-> 9]} : TRUE) = [zzk |-> 9]
====

(*--- recorded
all:
  exit: 0
---*)
