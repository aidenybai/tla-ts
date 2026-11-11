(*---
description: "@@ prefers the left on a shared key."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_left_biased ----
EXTENDS TLC, Naturals
Test == ((1 :> "a") @@ (1 :> "b"))[1] = "a"
====

(*--- recorded
all:
  exit: 0
---*)
