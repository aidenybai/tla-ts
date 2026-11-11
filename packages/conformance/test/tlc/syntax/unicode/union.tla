(*---
description: "∪ works as \\cup."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE union ----
Test == {1} ∪ {2} = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
