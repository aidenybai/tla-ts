(*---
description: "A THEOREM body may be any value, since TLC never evaluates it."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_of_non_boolean ----
THEOREM 1
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
