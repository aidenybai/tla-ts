(*---
description: "A label in a LET definition is that definition's own."
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_let_definition ----
Test == LET a == l:: TRUE IN a
====

(*--- recorded
all:
  exit: 0
---*)
