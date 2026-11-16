(*---
description: ASSUME NEW _ ++ _ binds an infix operator.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_new_infix ----
THEOREM ASSUME NEW _ ++ _ PROVE (1 ++ 2) = (1 ++ 2)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
