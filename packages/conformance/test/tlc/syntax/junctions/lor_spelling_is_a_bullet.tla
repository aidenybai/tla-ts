(*---
description: "\\lor spelled out starts a list and aligns with \\/ ."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE lor_spelling_is_a_bullet ----
Test ==
  \/ FALSE
  \lor TRUE
====

(*--- recorded
all:
  exit: 0
---*)
