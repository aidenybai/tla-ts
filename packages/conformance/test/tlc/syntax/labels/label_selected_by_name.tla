(*---
description: "Op!l names the labeled body."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_selected_by_name ----
EXTENDS Naturals
Op == l:: 1 + 1
Test == Op!l = 2
====

(*--- recorded
all:
  exit: 0
---*)
