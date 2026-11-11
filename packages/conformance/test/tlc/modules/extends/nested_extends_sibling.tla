(*---
description: A nested module may extend an earlier sibling.
ref: "tla2sany/semantic/Generator.java#processExtendsList"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE nested_extends_sibling ----
---- MODULE A ----
X == 1
====
---- MODULE B ----
EXTENDS A
Y == X
====
INSTANCE B
Test == Y = 1 /\ X = 1
====

(*--- recorded
all:
  exit: 0
---*)
