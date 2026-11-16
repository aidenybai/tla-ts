(*---
description: "∨ works as infix \\/."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE or_infix ----
Test == FALSE ∨ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
