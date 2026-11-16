(*---
description: A list may begin in the first column on its own line.
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE bullet_in_column_one ----
Test ==
/\ TRUE
/\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
