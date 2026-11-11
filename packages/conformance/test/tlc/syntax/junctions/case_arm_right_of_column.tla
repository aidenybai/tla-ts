(*---
description: A CASE separator right of the bullet stays in the item.
ref: "tla2sany/parser/TLAplusParser.java#caseSep"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE case_arm_right_of_column ----
Test ==
  /\ CASE FALSE -> FALSE
       [] TRUE -> TRUE
====

(*--- recorded
all:
  exit: 0
---*)
