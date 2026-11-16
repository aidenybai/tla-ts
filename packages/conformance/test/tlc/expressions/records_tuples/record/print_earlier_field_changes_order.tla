(*---
description: "A field name that appears earlier in the module sorts earlier, whatever the printed record says."
ref: "tlc2/value/impl/RecordValue.java#sort"
flags: [expression]
outcome: success
---*)
---- MODULE print_earlier_field_changes_order ----
EXTENDS Integers, TLC
First == [zzp |-> 0]
Test == PrintT([zzq |-> 1, zzp |-> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [zzp |-> 2, zzq |-> 1]"
---*)
