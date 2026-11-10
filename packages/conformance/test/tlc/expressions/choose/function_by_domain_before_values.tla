(*---
description: "Normalized order compares functions by size, then by domain, then by values."
ref: "tlc2/value/impl/FcnRcdValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE function_by_domain_before_values ----
EXTENDS Integers, TLC
Test == (CHOOSE x \in {3 :> 0, 2 :> 9} : TRUE) = (2 :> 9)
====

(*--- recorded
all:
  exit: 0
---*)
