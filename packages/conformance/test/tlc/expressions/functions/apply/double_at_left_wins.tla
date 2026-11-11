(*---
description: "@@ keeps the value of the left function on a shared key."
ref: "tlc2/module/TLC.java#CombineFcn"
flags: [expression]
outcome: success
---*)
---- MODULE double_at_left_wins ----
EXTENDS Integers, TLC
Test == ((1 :> 2) @@ (1 :> 3))[1] = 2
====

(*--- recorded
all:
  exit: 0
---*)
