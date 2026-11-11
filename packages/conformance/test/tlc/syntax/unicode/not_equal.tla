(*---
description: "≠ works as #."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE not_equal ----
Test == 1 ≠ 2
====

(*--- recorded
all:
  exit: 0
---*)
