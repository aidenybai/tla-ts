(*---
description: "CHOOSE over a set of records picks the smallest values in field order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE record_set_first ----
EXTENDS Integers
Test == (CHOOSE r \in [zzm : {2, 1}, zzn : {4, 3}] : TRUE) = [zzm |-> 1, zzn |-> 3]
====

(*--- recorded
all:
  exit: 0
---*)
