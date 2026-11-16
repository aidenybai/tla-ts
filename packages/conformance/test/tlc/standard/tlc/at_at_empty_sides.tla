(*---
description: An empty function on either side yields the other.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_empty_sides ----
EXTENDS TLC, Naturals
Test == <<>> @@ (1 :> 1) = <<1>> /\ (1 :> 1) @@ <<>> = <<1>> /\ <<>> @@ <<>> = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
