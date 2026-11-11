(*---
description: A Bags.tla beside the spec replaces the standard module.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Bags.tla]
outcome: success
---*)
---- MODULE file_definition_visible ----
EXTENDS Bags
Test == FromFile = 7
====

(*--- recorded
all:
  exit: 0
---*)
