(*---
description: "Normalized order compares records by their field names, in token order, before their values."
ref: "tlc2/value/impl/RecordValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE record_by_field_name_token_first ----
EXTENDS Integers
Test == (CHOOSE x \in {[zzf |-> 9], [zzg |-> 1]} : TRUE) = [zzf |-> 9]
====

(*--- recorded
all:
  exit: 0
---*)
