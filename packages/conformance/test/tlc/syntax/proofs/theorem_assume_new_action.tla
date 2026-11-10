(*---
description: ASSUME NEW ACTION x is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_action ----
THEOREM ASSUME NEW ACTION x PROVE x = x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
