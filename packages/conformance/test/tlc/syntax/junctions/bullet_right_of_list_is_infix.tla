(*---
description: "A /\\ right of the list's column is an infix inside the current item."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE bullet_right_of_list_is_infix ----
Test ==
  ~ /\ TRUE
     /\ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
