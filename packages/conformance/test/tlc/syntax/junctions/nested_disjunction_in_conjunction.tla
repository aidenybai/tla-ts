(*---
description: "A deeper \\/ list is one item of the /\\ list around it."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE nested_disjunction_in_conjunction ----
Test ==
  /\ \/ FALSE
     \/ TRUE
  /\ \/ TRUE
     \/ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
