(*---
description: "An instance's infix operator may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE infix_through_instance_nonfix ----
M == INSTANCE Naturals
Test == M!+(1, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
