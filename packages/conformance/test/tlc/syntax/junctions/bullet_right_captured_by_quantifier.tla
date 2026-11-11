(*---
description: "A /\\ right of the list's column is inside the item, so the item's quantifier scope still covers it."
ref: "tla2sany/parser/JunctionListContext.java#isAboveCurrent"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE bullet_right_captured_by_quantifier ----
Test ==
  /\ \E z \in {1} : TRUE
    /\ z = 1
====

(*--- recorded
all:
  exit: 0
---*)
