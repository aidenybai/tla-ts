(*---
description: LEMMA is THEOREM.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE lemma_keyword ----
LEMMA FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
