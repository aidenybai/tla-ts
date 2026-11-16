(*---
description: "Functions with equal domains sort by values."
ref: "tlc2/value/impl/FcnRcdValue.java#compareOtherInterval"
flags: [expression]
outcome: success
---*)
---- MODULE functions_by_values ----
EXTENDS Integers, TLC
Test == PrintT({(1 :> 2), (1 :> 1)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1>>, <<2>>}"
---*)
