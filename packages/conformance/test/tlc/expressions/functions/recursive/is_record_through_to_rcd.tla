(*---
description: "A recursive function on strings equals a record through toRcd."
ref: "tlc2/value/impl/FcnLambdaValue.java#toRcd"
flags: [expression]
outcome: success
---*)
---- MODULE is_record_through_to_rcd ----
EXTENDS Integers
F[s \in {"a"}] == IF FALSE THEN F["a"] ELSE 1
Test == [a |-> 1] = F
====

(*--- recorded
all:
  exit: 0
---*)
