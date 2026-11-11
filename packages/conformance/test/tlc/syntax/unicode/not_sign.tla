(*---
description: ¬ works as ~.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE not_sign ----
Test == ¬ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
