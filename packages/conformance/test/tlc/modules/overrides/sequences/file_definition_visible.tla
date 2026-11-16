(*---
description: A Sequences.tla beside the spec replaces the standard module.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Sequences.tla]
outcome: success
---*)
---- MODULE file_definition_visible ----
EXTENDS Sequences
Test == FromFile = 7
====

(*--- recorded
all:
  exit: 0
---*)
