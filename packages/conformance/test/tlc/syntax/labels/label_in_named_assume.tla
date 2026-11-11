(*---
description: "A named ASSUME is a definition, so it may hold a label."
ref: "tla2sany/semantic/Generator.java#inOpDefNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_named_assume ----
ASSUME A == l:: TRUE
Test == A!l
====

(*--- recorded
all:
  exit: 0
---*)
