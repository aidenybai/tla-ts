(*---
description: "A deeper /\\ list is one item of the \\/ list around it."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE nested_conjunction_in_disjunction ----
Test ==
  \/ /\ FALSE
     /\ TRUE
  \/ /\ TRUE
     /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
