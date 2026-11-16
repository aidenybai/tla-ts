(*---
description: "EXTENDS also brings the nested modules of the extended module, which may then be instanced."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE inner_extended_brings_inner_module ----
---- MODULE I ----
---- MODULE J ----
A == 7
====
====
---- MODULE K ----
EXTENDS I
INSTANCE J
B == A
====
INSTANCE K
Test == B = 7
====

(*--- recorded
all:
  exit: 0
---*)
