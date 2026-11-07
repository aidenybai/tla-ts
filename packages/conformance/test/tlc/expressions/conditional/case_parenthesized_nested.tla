(*---
description: "Parentheses keep a nested CASE from absorbing the outer arms."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_parenthesized_nested ----
EXTENDS Integers
Test == (CASE FALSE -> (CASE TRUE -> 1) [] TRUE -> 3) = 3
====

(*--- recorded
all:
  exit: 0
---*)
