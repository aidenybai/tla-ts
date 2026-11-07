(*---
description: A replacing Integers.tla may itself extend the standard Naturals.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Integers.tla]
outcome: success
---*)
---- MODULE extends_standard_naturals ----
EXTENDS Integers
Test == FromFile = 7 /\ 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
