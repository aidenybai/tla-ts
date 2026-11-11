(*---
description: "A label inside a label starts a new label set, so it may reuse the outer name."
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE nested_same_name ----
Op == l:: l:: TRUE
Test == Op!l!l
====

(*--- recorded
all:
  exit: 0
---*)
