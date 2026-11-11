(*---
description: "A Naturals.tla beside the spec replaces the standard module, so its own definitions are visible."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Naturals.tla]
outcome: success
---*)
---- MODULE file_definition_visible ----
EXTENDS Naturals
Test == FromFile = 7 /\ OnlyHere(1) = 1
====

(*--- recorded
all:
  exit: 0
---*)
