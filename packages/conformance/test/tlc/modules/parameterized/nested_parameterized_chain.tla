(*---
description: Parameterized instances compose.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE nested_parameterized_chain ----
---- MODULE J ----
CONSTANT k
d == k
====
---- MODULE I ----
N(b) == INSTANCE J WITH k <- b
====
M(a) == INSTANCE I
Test == M(1)!N(2)!d = 2
====

(*--- recorded
all:
  exit: 0
---*)
