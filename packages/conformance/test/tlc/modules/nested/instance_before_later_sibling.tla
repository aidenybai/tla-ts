(*---
description: A sibling module may instance an earlier one.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE instance_before_later_sibling ----
---- MODULE I ----
A == 8
====
---- MODULE J ----
INSTANCE I
B == A
====
INSTANCE J
Test == B = 8
====

(*--- recorded
all:
  exit: 0
---*)
