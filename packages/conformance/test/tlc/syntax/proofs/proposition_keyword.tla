(*---
description: PROPOSITION is THEOREM.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE proposition_keyword ----
PROPOSITION FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
