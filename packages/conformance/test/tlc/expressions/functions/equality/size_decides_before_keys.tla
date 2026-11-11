(*---
description: "Function records of different size differ before any key comparison."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE size_decides_before_keys ----
EXTENDS Integers, TLC
Test == (1 :> 0) # (("a" :> 0) @@ ("b" :> 0))
====

(*--- recorded
all:
  exit: 0
---*)
