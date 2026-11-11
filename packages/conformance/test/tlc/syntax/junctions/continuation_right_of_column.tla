(*---
description: An operand right of the bullet is part of the item.
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE continuation_right_of_column ----
Test ==
  /\ 1 =
   1
====

(*--- recorded
all:
  exit: 0
---*)
