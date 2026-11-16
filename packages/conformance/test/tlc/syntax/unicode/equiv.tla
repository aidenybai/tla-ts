(*---
description: "≡ works as \\equiv."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE equiv ----
Test == TRUE ≡ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
