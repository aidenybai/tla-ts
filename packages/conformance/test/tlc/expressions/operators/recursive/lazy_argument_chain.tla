(*---
description: "Each recursive level binds a lazy argument in the context of its caller, so old values stay reachable."
ref: "tlc2/util/Context.java#cons"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_argument_chain ----
EXTENDS Integers
RECURSIVE Count(_, _)
Count(n, acc) == IF n = 0 THEN acc ELSE Count(n - 1, acc + n)
Test == Count(50, 0) = 1275
====

(*--- recorded
all:
  exit: 0
---*)
