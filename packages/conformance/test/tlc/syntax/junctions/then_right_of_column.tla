(*---
description: IF parts right of the bullet are in the item.
ref: "tla2sany/parser/TLAplusParser.java#checkIndentation"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE then_right_of_column ----
Test ==
  /\ IF TRUE
   THEN TRUE
   ELSE FALSE
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
