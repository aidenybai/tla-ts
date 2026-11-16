(*---
description: "= on a lazy filter converts it to an enumerated set."
ref: "tlc2/value/impl/SetPredValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_equals_converts ----
EXTENDS Integers
Test == {s \in SUBSET {1} : s = {}} = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
