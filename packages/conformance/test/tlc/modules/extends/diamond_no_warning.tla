(*---
description: "A module reached by two paths is one set of symbols, with no warning."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla, FixExtC.tla, FixExtD.tla]
outcome: success
---*)
---- MODULE diamond_no_warning ----
EXTENDS FixExtC, FixExtD
Test == OnlyA = 10
====

(*--- recorded
all:
  exit: 0
---*)
