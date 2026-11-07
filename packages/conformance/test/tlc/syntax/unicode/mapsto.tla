(*---
description: "↦ works as |->."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE mapsto ----
Test == [x ∈ {1} ↦ x][1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
