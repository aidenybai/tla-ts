(*---
description: "A LET definition's label is reached with !:! before the LET name."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE let_label_selected_through_colon ----
Op == LET a == l:: 1 = 1 IN a
Test == Op!:!a!l
====

(*--- recorded
all:
  exit: 0
---*)
