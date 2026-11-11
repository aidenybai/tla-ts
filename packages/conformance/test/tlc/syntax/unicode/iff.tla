(*---
description: "⇔ works as <=>."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE iff ----
Test == TRUE ⇔ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
