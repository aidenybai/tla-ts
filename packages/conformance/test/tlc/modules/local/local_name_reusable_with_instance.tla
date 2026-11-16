(*---
description: "An outer definition may reuse an instanced module's LOCAL name."
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_name_reusable_with_instance ----
---- MODULE I ----
LOCAL Hid == 1
Pub == Hid
====
INSTANCE I
Hid == 7
Test == Hid = 7 /\ Pub = 1
====

(*--- recorded
all:
  exit: 0
---*)
