(*---
description: A comment that moves a bullet right keeps it inside the item.
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE comment_moves_bullet_out_of_alignment ----
Test ==
  /\ \E z \in {1} : TRUE
(* c *) /\ z = 1
====

(*--- recorded
all:
  exit: 0
---*)
