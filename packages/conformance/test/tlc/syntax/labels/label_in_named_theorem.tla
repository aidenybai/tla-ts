(*---
description: "A named THEOREM is a definition, so it may hold a label."
ref: "tla2sany/semantic/Generator.java#inOpDefNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_named_theorem ----
THEOREM T == l:: TRUE
Test == T!l
====

(*--- recorded
all:
  exit: 0
---*)
