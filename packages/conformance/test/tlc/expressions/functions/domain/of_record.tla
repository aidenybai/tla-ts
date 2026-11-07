(*---
description: "DOMAIN of a record is the set of field names as strings."
ref: "tlc2/value/impl/RecordValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_record ----
EXTENDS Integers
Test == DOMAIN [b |-> 1, a |-> 2] = {"a", "b"}
====

(*--- recorded
all:
  exit: 0
---*)
