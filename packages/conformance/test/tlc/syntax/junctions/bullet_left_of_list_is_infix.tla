(*---
description: "A /\\ left of the list's column ends the list and is an infix between the list and its right operand."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE bullet_left_of_list_is_infix ----
Test == ~ (/\ TRUE
/\ FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
