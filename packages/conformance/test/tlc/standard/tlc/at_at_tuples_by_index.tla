(*---
description: "@@ on tuples works by index: the longer right tail survives."
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE at_at_tuples_by_index ----
EXTENDS TLC, Naturals
Test == <<1, 2>> @@ <<3, 4, 5>> = <<1, 2, 5>>
====

(*--- recorded
all:
  exit: 0
---*)
