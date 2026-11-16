(*---
description: getAssumptions includes those of extended modules.
ref: tla2sany/semantic/ModuleNode.java#getAssumptions
outcome: assumption-violation
config: ""
includes:
  - assume_false_fixture.tla
---*)
---- MODULE from_extended_module ----
EXTENDS assume_false_fixture
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 2, col 8 to line 2, col 12 of module assume_false_fixture is false.
---*)
