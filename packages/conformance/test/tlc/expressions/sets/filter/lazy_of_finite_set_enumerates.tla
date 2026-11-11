(*---
description: "A filter over a non-Reducible finite set enumerates when compared."
ref: "tlc2/value/impl/SetPredValue.java#toSetEnum"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_of_finite_set_enumerates ----
EXTENDS Integers
Test == {s \in SUBSET {1, 2} : 2 \in s} = {{2}, {1, 2}}
====

(*--- recorded
all:
  exit: 0
---*)
