(*---
description: "An instance's prefix minus is -. in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE prefix_through_instance ----
M == INSTANCE Integers
Test == M!-.(1) = M!-(0, 1)
====

(*--- recorded
all:
  exit: 0
---*)
