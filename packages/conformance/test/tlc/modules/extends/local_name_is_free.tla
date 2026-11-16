(*---
description: "An extended module's LOCAL name may be reused."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixLocal.tla]
outcome: success
---*)
---- MODULE local_name_is_free ----
EXTENDS FixLocal
Hidden == 7
Test == Hidden = 7 /\ Visible = 1
====

(*--- recorded
all:
  exit: 0
---*)
