(*---
description: BY ONLY is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_only ----
THEOREM FALSE BY ONLY TRUE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
