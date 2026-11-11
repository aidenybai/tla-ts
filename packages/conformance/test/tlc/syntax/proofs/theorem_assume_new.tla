(*---
description: ASSUME NEW x may bind a name for the rest.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new ----
THEOREM ASSUME NEW x PROVE x = x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
