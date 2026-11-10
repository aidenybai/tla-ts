(*---
description: "Tuple equality reaches sets inside the components."
ref: "tlc2/value/impl/TupleValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE sets_inside_tuples_normalize ----
EXTENDS Integers
Test == <<{2, 1}>> = <<{1, 2}>>
====

(*--- recorded
all:
  exit: 0
---*)
