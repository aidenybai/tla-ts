(*---
description: "∷ works as ::."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE label_colon ----
Op ≜ l1 ∷ TRUE
Test == Op!l1
====

(*--- recorded
all:
  exit: 0
---*)
