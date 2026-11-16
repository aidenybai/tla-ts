(*---
description: "Normalized order compares function values when the domains match."
ref: "tlc2/value/impl/FcnRcdValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE function_values_after_domain ----
EXTENDS Integers, TLC
Test == (CHOOSE x \in {2 :> 9, 2 :> 0} : TRUE) = (2 :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
