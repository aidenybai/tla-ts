(*---
description: "⇒ works as =>."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE implies ----
Test == FALSE ⇒ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
