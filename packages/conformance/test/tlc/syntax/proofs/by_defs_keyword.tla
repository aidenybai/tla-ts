(*---
description: DEFS is DEF.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_defs_keyword ----
A == 1
B == 2
THEOREM FALSE BY DEFS A, B
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
