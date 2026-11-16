(*---
description: Unicode symbols in a block comment are skipped.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE in_comment ----
(* ∧ ∀ ≜ *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
