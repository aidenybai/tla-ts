(*---
description: ASSUME NEW TEMPORAL x is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_temporal ----
THEOREM ASSUME NEW TEMPORAL x PROVE x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
