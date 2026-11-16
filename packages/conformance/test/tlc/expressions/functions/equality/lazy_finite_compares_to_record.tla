(*---
description: "A finite lazy function compares after toFcnRcd."
ref: "tlc2/value/impl/FcnLambdaValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_finite_compares_to_record ----
EXTENDS Integers, TLC
Test == [s \in SUBSET {1} |-> 0] = ({} :> 0) @@ ({1} :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
