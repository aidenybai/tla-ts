(*---
description: "Functions on tuple keys compare through normalized domains."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE function_on_tuple_keys ----
EXTENDS Integers, TLC
Test == [t \in {<<2>>, <<1>>} |-> t[1]] = (<<1>> :> 1) @@ (<<2>> :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
