(*---
description: "An extended module's THEOREM is not checked."
ref: "tla2sany/semantic/ModuleNode.java#copyTheorems"
features: [extends]
flags: [expression]
includes: [FixFalseTheorem.tla]
outcome: success
---*)
---- MODULE theorem_in_extended_not_checked ----
EXTENDS FixFalseTheorem
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
