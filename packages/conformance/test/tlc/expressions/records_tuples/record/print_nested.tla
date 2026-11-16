(*---
description: "Nested records and tuples print in brackets."
ref: "tlc2/value/impl/RecordValue.java#toString"
flags: [expression]
outcome: success
---*)
---- MODULE print_nested ----
EXTENDS Integers, TLC
Test == PrintT([zzg |-> <<1, [zzh |-> {}]>>])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [zzg |-> <<1, [zzh |-> {}]>>]"
---*)
