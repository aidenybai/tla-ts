(*---
description: "SUBSET S equals the enumerated power set."
ref: "tlc2/value/impl/SubsetValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_enum ----
EXTENDS Integers
Test == SUBSET {1, 2} = {{}, {1}, {2}, {1, 2}}
====

(*--- recorded
all:
  exit: 0
---*)
