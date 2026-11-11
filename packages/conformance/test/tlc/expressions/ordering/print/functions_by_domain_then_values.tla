(*---
description: "Functions of equal size sort by domain before values."
ref: "tlc2/value/impl/FcnRcdValue.java#compareOtherInterval"
flags: [expression]
outcome: success
---*)
---- MODULE functions_by_domain_then_values ----
EXTENDS Integers, TLC
Test == PrintT({(2 :> 0), (1 :> 5)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<5>>, (2 :> 0)}"
---*)
