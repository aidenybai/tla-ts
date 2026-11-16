(*---
description: An inner label is reached through its outer label.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE nested_selected_through_outer ----
Op == l:: (m:: TRUE) /\ (n:: TRUE)
Test == Op!l!m /\ Op!l!n
====

(*--- recorded
all:
  exit: 0
---*)
