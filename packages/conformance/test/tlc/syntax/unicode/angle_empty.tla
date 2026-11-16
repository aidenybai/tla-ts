(*---
description: ⟨⟩ is the empty tuple.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE angle_empty ----
Test == ⟨⟩ = << >>
====

(*--- recorded
all:
  exit: 0
---*)
