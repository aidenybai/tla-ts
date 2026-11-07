(*---
description: A nested module named like a standard module wins over the disk for INSTANCE after it.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE inner_shadows_module_on_disk ----
---- MODULE Bags ----
A == 8
====
INSTANCE Bags
Test == A = 8
====

(*--- recorded
all:
  exit: 0
---*)
