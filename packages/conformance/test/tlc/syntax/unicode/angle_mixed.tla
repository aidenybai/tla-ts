(*---
description: Unicode and ASCII angle brackets match each other.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE angle_mixed ----
Test == ⟨1>> = <<1⟩
====

(*--- recorded
all:
  exit: 0
---*)
