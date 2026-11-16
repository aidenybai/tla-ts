(*---
description: "@@ builds an unnormalized function, and equality normalizes it first."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE unnormalized_double_at ----
EXTENDS Integers, TLC
Test == ((2 :> 0) @@ (1 :> 0)) = ((1 :> 0) @@ (2 :> 0))
====

(*--- recorded
all:
  exit: 0
---*)
