(*---
description: "EXCEPT on a tuple replaces one component."
ref: "tlc2/value/impl/TupleValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_replaces_one ----
EXTENDS Integers
Test == [<<1, 2>> EXCEPT ![2] = 9] = <<1, 9>>
====

(*--- recorded
all:
  exit: 0
---*)
