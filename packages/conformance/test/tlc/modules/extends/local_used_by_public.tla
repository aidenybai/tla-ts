(*---
description: "A public definition may use the extended module's LOCAL one."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixLocal.tla]
outcome: success
---*)
---- MODULE local_used_by_public ----
EXTENDS FixLocal
Test == Visible = 1
====

(*--- recorded
all:
  exit: 0
---*)
