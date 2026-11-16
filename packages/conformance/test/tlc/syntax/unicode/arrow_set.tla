(*---
description: "→ works as -> in a function set."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE arrow_set ----
Test == [x ∈ {1} ↦ x] ∈ [{1} → {1}]
====

(*--- recorded
all:
  exit: 0
---*)
