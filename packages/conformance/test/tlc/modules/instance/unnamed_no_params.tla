(*---
description: INSTANCE of a module with no declarations brings its definitions.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE unnamed_no_params ----
---- MODULE I ----
A == 1
====
INSTANCE I
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
