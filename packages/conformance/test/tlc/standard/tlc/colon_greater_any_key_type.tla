(*---
description: :> takes any value as key.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_any_key_type ----
EXTENDS TLC, Naturals
Test == ({1} :> 1)[{1}] = 1 /\ (<<1>> :> 1)[<<1>>] = 1 /\ (TRUE :> 1)[TRUE] = 1
====

(*--- recorded
all:
  exit: 0
---*)
