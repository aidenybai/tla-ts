(*---
description: "A nested dot path updates one inner field."
ref: "tlc2/value/impl/RecordValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE nested_path_record ----
EXTENDS Integers
Test == [[a |-> [b |-> 1, c |-> 2]] EXCEPT !.a.b = 9] = [a |-> [b |-> 9, c |-> 2]]
====

(*--- recorded
all:
  exit: 0
---*)
