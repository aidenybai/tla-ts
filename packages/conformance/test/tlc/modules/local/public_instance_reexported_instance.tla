(*---
description: Names brought by public INSTANCE pass on through INSTANCE.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE public_instance_reexported_instance ----
---- MODULE I ----
INSTANCE Naturals
====
INSTANCE I
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
