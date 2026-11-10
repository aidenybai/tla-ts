(*---
description: "A \\/ at the column of a /\\ list ends the list and acts as infix, so the result is the disjunction."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE same_column_other_kind_ends_list ----
Test ==
  /\ FALSE
  \/ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
