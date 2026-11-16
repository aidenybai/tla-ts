(*---
description: COROLLARY is THEOREM.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE corollary_keyword ----
COROLLARY FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
