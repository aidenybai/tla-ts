(*---
description: LOCAL INSTANCE brings names for this module.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_instance_unnamed ----
LOCAL INSTANCE Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
