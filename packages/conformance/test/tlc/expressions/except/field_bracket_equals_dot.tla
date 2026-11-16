(*---
description: "![\"a\"] and !.a are the same path."
ref: "tlc2/value/impl/RecordValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE field_bracket_equals_dot ----
EXTENDS Integers
Test == [[a |-> 1] EXCEPT !["a"] = 9] = [[a |-> 1] EXCEPT !.a = 9]
====

(*--- recorded
all:
  exit: 0
---*)
