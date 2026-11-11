(*---
description: Integers then Naturals is no conflict either.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE integers_then_naturals ----
EXTENDS Integers, Naturals
Test == -1 + 1 = 0
====

(*--- recorded
all:
  exit: 0
---*)
