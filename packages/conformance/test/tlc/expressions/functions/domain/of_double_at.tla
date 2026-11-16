(*---
description: "DOMAIN of f @@ g is the union of the domains."
ref: "tlc2/module/TLC.java#CombineFcn"
flags: [expression]
outcome: success
---*)
---- MODULE of_double_at ----
EXTENDS Integers, TLC
Test == DOMAIN ((1 :> 0) @@ (2 :> 0)) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
