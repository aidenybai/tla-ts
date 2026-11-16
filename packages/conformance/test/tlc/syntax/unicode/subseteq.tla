(*---
description: "⊆ works as \\subseteq."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE subseteq ----
Test == {} ⊆ {}
====

(*--- recorded
all:
  exit: 0
---*)
