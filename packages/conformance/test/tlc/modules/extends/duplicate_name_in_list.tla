(*---
description: A module may be listed twice in EXTENDS.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
flags: [expression]
includes: [FixExtA.tla]
outcome: success
---*)
---- MODULE duplicate_name_in_list ----
EXTENDS FixExtA, FixExtA
Test == OnlyA = 10
====

(*--- recorded
all:
  exit: 0
---*)
