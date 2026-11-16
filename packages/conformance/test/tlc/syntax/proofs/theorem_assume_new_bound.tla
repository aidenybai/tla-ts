(*---
description: "ASSUME NEW x \\in S binds a name in a set."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_bound ----
THEOREM ASSUME NEW x \in {1} PROVE x = 1
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
