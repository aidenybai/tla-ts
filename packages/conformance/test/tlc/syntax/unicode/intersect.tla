(*---
description: "∩ works as \\cap."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE intersect ----
Test == {1} ∩ {1} = {1}
====

(*--- recorded
all:
  exit: 0
---*)
