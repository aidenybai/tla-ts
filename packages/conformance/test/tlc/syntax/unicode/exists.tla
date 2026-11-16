(*---
description: "∃ works as \\E."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE exists ----
Test == ∃ x ∈ {1} : x = 1
====

(*--- recorded
all:
  exit: 0
---*)
