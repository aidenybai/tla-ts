(*---
description: "∉ works as \\notin."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE not_in ----
Test == 1 ∉ {}
====

(*--- recorded
all:
  exit: 0
---*)
