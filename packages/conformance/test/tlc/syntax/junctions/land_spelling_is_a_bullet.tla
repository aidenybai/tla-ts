(*---
description: "\\land spelled out starts a list and aligns with /\\ ."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE land_spelling_is_a_bullet ----
Test ==
  /\ \E z \in {1} : TRUE
  \land TRUE
====

(*--- recorded
all:
  exit: 0
---*)
