(*---
description: "Naturals then Integers is no conflict, since Integers extends Naturals."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE naturals_then_integers ----
EXTENDS Naturals, Integers
Test == -1 + 1 = 0
====

(*--- recorded
all:
  exit: 0
---*)
