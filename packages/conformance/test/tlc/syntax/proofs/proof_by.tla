(*---
description: PROOF BY is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE proof_by ----
THEOREM FALSE PROOF BY TRUE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
