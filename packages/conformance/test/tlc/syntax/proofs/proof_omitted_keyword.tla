(*---
description: PROOF OMITTED is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE proof_omitted_keyword ----
THEOREM FALSE PROOF OMITTED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
