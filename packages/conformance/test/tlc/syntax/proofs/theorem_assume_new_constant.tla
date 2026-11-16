(*---
description: ASSUME NEW CONSTANT x is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_constant ----
THEOREM ASSUME NEW CONSTANT x PROVE x = x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
