(*---
description: "Aligned /\\ bullets conjoin every item."
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE aligned_conjunction_is_all ----
Test == ~ /\ TRUE
          /\ FALSE
          /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
