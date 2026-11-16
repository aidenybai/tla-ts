(*---
description: DOMAIN of :> is the singleton.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE colon_greater_domain ----
EXTENDS TLC, Naturals
Test == DOMAIN (5 :> "v") = {5}
====

(*--- recorded
all:
  exit: 0
---*)
