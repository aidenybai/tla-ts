(*---
description: DOMAIN of @@ is the union of domains.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_domain ----
EXTENDS TLC, Naturals
Test == DOMAIN ((1 :> 1) @@ (3 :> 3)) = {1, 3}
====

(*--- recorded
all:
  exit: 0
---*)
