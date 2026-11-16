(*---
description: "Number literals do not depend on the Naturals module, even an empty replacement."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Naturals.tla]
outcome: success
---*)
---- MODULE numbers_need_no_naturals ----
EXTENDS Naturals
Test == 1 = 1
====

(*--- recorded
all:
  exit: 0
---*)
