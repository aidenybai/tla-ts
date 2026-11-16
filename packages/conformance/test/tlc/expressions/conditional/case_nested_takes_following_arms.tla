(*---
description: "A nested CASE absorbs the [] arms that follow it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_nested_takes_following_arms ----
EXTENDS Integers
Test == (CASE TRUE -> CASE FALSE -> 1 [] TRUE -> 2 [] TRUE -> 3) = 2
====

(*--- recorded
all:
  exit: 0
---*)
