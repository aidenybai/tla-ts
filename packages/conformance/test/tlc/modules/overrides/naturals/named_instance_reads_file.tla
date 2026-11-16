(*---
description: A named INSTANCE also reads the file beside the spec.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
flags: [expression]
includes: [Naturals.tla]
outcome: success
---*)
---- MODULE named_instance_reads_file ----
M == INSTANCE Naturals
Test == M!FromFile = 7 /\ M!+(1, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
