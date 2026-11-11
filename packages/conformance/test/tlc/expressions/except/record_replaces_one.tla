(*---
description: "EXCEPT on a record replaces one field."
ref: "tlc2/value/impl/RecordValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE record_replaces_one ----
EXTENDS Integers
Test == [[a |-> 1, b |-> 2] EXCEPT !.a = 9] = [a |-> 9, b |-> 2]
====

(*--- recorded
all:
  exit: 0
---*)
