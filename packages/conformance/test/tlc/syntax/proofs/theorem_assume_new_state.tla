(*---
description: ASSUME NEW STATE x is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_state ----
THEOREM ASSUME NEW STATE x PROVE x = x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
