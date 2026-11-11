(*---
description: "⟨ and ⟩ work as << and >>."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE angle_tuple ----
Test == ⟨1, 2⟩[2] = 2
====

(*--- recorded
all:
  exit: 0
---*)
