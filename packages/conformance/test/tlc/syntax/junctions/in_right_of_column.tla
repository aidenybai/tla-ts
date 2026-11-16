(*---
description: LET parts right of the bullet are in the item.
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE in_right_of_column ----
Test ==
  /\ LET x == 1
     IN x = 1
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
