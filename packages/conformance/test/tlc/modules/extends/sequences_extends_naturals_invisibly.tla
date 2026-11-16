(*---
description: "Sequences extends Naturals only locally, so + is not visible through it."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
outcome: success
---*)
---- MODULE sequences_extends_naturals_invisibly ----
EXTENDS Sequences
a + b == 7
Test == 1 + 2 = 7
====

(*--- recorded
all:
  exit: 0
---*)
