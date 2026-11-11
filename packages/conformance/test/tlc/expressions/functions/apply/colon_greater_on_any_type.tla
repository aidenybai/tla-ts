(*---
description: ":> makes a function on any key type."
ref: "tlc2/module/TLC.java#MakeFcn"
flags: [expression]
outcome: success
---*)
---- MODULE colon_greater_on_any_type ----
EXTENDS Integers, TLC
Test == ({1} :> 2)[{1}] = 2 /\ (<<1>> :> 2)[<<1>>] = 2 /\ (TRUE :> 2)[TRUE] = 2
====

(*--- recorded
all:
  exit: 0
---*)
