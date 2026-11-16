(*---
description: Names brought by public INSTANCE pass on through EXTENDS.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE public_instance_reexported_extends ----
---- MODULE I ----
INSTANCE Naturals
====
---- MODULE J ----
EXTENDS I
B == 1 + 1
====
INSTANCE J
Test == B = 2
====

(*--- recorded
all:
  exit: 0
---*)
