(*---
description: ASSUME NEW F(_) binds an operator.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_operator ----
THEOREM ASSUME NEW F(_) PROVE F(1) = F(1)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
