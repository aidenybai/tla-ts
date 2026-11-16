(*---
description: A public definition may use a LOCAL one through an unnamed instance.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE public_uses_local_through_unnamed ----
---- MODULE I ----
LOCAL Hid == 1
Pub == Hid
====
INSTANCE I
Test == Pub = 1
====

(*--- recorded
all:
  exit: 0
---*)
