(*---
description: A bullet at the outer column ends the inner list and starts a new outer item.
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE inner_list_closes_when_outer_bullet_arrives ----
Test ==
  ~ /\ \/ TRUE
       \/ TRUE
    /\ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
