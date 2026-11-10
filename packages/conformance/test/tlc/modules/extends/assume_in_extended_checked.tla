(*---
description: "An extended module's ASSUME is checked."
ref: "tla2sany/semantic/ModuleNode.java#copyAssumes"
features: [extends]
includes: [FixFalseAssume.tla]
outcome: assumption-violation
---*)
---- MODULE assume_in_extended_checked ----
EXTENDS FixFalseAssume
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 2, col 8 to line 2, col 12 of module FixFalseAssume is false.
---*)
