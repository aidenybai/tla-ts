(*---
description: "A record is unequal to an untyped model value, on either side."
ref: "tlc2/value/impl/RecordValue.java#equals"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_unequal ----
EXTENDS Integers
CONSTANT mv
Test == [a |-> 1] # mv /\ mv # [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
