(*---
description: Inner labels under different outer labels may share a name.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE sibling_subtrees_reuse_inner_name ----
Op == (a:: (m:: TRUE)) /\ (b:: (m:: TRUE))
Test == Op!a!m /\ Op!b!m
====

(*--- recorded
all:
  exit: 0
---*)
