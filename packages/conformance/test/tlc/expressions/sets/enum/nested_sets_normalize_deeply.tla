(*---
description: "Equality normalizes nested sets, so element order inside inner sets does not matter."
ref: "tlc2/value/impl/SetEnumValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE nested_sets_normalize_deeply ----
EXTENDS Integers
Test == {{2, 1}, {4, 3}} = {{3, 4}, {1, 2}}
====

(*--- recorded
all:
  exit: 0
---*)
