(*---
description: "Tuples of different length differ before components are compared."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE length_compared_first ----
EXTENDS Integers
Test == <<1>> # <<"a", 2>>
====

(*--- recorded
all:
  exit: 0
---*)
