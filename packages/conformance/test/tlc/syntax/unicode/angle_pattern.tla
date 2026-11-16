(*---
description: ⟨ ⟩ work as a tuple pattern.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE angle_pattern ----
Test == \A ⟨x, y⟩ ∈ {⟨1, 2⟩} : x = 1
====

(*--- recorded
all:
  exit: 0
---*)
