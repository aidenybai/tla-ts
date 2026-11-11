(*---
description: "Records print with their fields in name token order, which is the order the names first appear in the source."
ref: "tlc2/value/impl/RecordValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE print_sorts_by_first_appearance ----
EXTENDS Integers, TLC
Test == PrintT([zzq |-> 1, zzp |-> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [zzq |-> 1, zzp |-> 2]"
---*)
