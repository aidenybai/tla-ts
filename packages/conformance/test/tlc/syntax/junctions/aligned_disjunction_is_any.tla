(*---
description: "Aligned \\/ bullets disjoin every item."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE aligned_disjunction_is_any ----
Test == \/ FALSE
        \/ TRUE
        \/ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
