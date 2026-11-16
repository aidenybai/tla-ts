(*---
description: A standard module may be listed twice in EXTENDS.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE duplicate_standard_in_list ----
EXTENDS Naturals, Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
