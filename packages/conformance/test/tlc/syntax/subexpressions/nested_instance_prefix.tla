(*---
description: "M!N!A reaches an instance of an instance."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE nested_instance_prefix ----
---- MODULE J ----
A == 7
====
---- MODULE I ----
N == INSTANCE J
====
M == INSTANCE I
Test == M!N!A = 7
====

(*--- recorded
all:
  exit: 0
---*)
