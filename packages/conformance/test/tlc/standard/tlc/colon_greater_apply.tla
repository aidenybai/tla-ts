(*---
description: :> applies at its key.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_apply ----
EXTENDS TLC, Naturals
Test == (5 :> "v")[5] = "v"
====

(*--- recorded
all:
  exit: 0
---*)
