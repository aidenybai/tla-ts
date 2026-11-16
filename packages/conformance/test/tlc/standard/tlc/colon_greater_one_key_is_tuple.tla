(*---
description: 1 :> v equals <<v>>.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_one_key_is_tuple ----
EXTENDS TLC, Naturals
Test == (1 :> "a") = <<"a">>
====

(*--- recorded
all:
  exit: 0
---*)
