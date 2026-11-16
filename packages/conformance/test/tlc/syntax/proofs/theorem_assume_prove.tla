(*---
description: A theorem may be an ASSUME/PROVE.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_assume_prove ----
THEOREM ASSUME TRUE PROVE FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
