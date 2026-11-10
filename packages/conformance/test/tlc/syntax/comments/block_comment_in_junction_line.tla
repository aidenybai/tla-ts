(*---
description: "A block comment before a bullet moves its column, and that column is what counts for alignment."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_in_junction_line ----
Test == /\ TRUE
(* c *) /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
