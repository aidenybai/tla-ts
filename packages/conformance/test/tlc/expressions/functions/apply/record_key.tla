(*---
description: "A function can have records as keys, found regardless of field order."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE record_key ----
EXTENDS Integers
F == [r \in {[a |-> 1, b |-> 2]} |-> 7]
Test == F[[b |-> 2, a |-> 1]] = 7
====

(*--- recorded
all:
  exit: 0
---*)
