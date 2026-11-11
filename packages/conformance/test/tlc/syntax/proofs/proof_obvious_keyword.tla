(*---
description: PROOF OBVIOUS is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE proof_obvious_keyword ----
THEOREM FALSE PROOF OBVIOUS
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
