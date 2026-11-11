(*---
description: A THEOREM whose body would fail in evaluation has no effect.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_evaluation_error_ignored ----
THEOREM 1 \in 2
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
