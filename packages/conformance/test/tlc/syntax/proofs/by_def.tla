(*---
description: BY DEF names a definition without evaluating it.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_def ----
A == 1
THEOREM FALSE BY DEF A
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
