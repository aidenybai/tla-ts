(*---
description: "A CASE subexpression is !i!1 for the guard and !i!2 for the value."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE case_arm_guard_and_value ----
Op == CASE TRUE -> 1 [] FALSE -> 2
Test == Op!1!1 /\ Op!1!2 = 1 /\ ~Op!2!1 /\ Op!2!2 = 2
====

(*--- recorded
all:
  exit: 0
---*)
