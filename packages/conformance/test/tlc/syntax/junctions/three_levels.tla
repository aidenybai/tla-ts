(*---
description: Three nested lists close back to the matching column.
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE three_levels ----
Test ==
  /\ \/ /\ TRUE
        /\ TRUE
     \/ FALSE
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
