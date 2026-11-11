(*---
description: ASSUME CONSTANT x is NEW CONSTANT x.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_constant_only ----
THEOREM ASSUME CONSTANT x PROVE x = x
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
