(*---
description: "A lazy function with excepts converts through toFcnRcd, which replays the excepts."
ref: "tlc2/value/impl/FcnLambdaValue.java#toFcnRcd"
flags: [expression]
outcome: success
---*)
---- MODULE finite_lazy_except_then_compare ----
EXTENDS Integers, TLC
Test == [[s \in SUBSET {1} |-> 0] EXCEPT ![{}] = 1] = ({} :> 1) @@ ({1} :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
