(*---
description: "An infix on the bullet's line stays in the item."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE infix_in_item_same_line ----
Test ==
  /\ TRUE \/ FALSE
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
