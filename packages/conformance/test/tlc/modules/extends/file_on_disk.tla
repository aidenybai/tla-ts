(*---
description: EXTENDS loads a module from a file beside the spec.
ref: "tla2sany/semantic/Generator.java#processExtendsList"
features: [extends]
flags: [expression]
includes: [FixExtA.tla]
outcome: success
---*)
---- MODULE file_on_disk ----
EXTENDS FixExtA
Test == OnlyA = 10
====

(*--- recorded
all:
  exit: 0
---*)
