(*---
description: Selectors work through an instance.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE through_instance ----
---- MODULE I ----
EXTENDS Naturals
Op(x) == x + 1
L == l:: 2 + 3
====
M == INSTANCE I
Test == M!Op(1)!1 = 1 /\ M!Op(4)!<< = 4 /\ M!L!l = 5 /\ M!L!l!2 = 3
====

(*--- recorded
all:
  exit: 0
---*)
