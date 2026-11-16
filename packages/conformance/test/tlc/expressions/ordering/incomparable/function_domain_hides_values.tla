(*---
description: "Functions with different keys sort without comparing values."
ref: "tlc2/value/impl/FcnRcdValue.java#compareOtherInterval"
flags: [expression]
outcome: success
---*)
---- MODULE function_domain_hides_values ----
EXTENDS Integers, FiniteSets, TLC
Test == Cardinality({(1 :> 1), (2 :> "a")}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
