(*---
description: LOCAL may prefix a named INSTANCE.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_instance_named ----
LOCAL M == INSTANCE Naturals
Test == M!+(1, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
