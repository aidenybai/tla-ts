(*---
description: A list on the same line as == uses its actual column.
ref: "tla2sany/parser/JunctionListContext.java#isNewBullet"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_after_definition_token ----
Test == /\ TRUE
        /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
