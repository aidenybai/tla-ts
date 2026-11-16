(*---
description: USE may name a theorem as a fact.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE use_theorem_as_fact ----
THEOREM T == FALSE
USE T
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
