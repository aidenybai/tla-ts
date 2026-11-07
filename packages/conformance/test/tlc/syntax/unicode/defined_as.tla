(*---
description: ≜ works as ==.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE defined_as ----
Test ≜ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
