(*---
description: HIDE may name a theorem as a fact.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE hide_theorem_as_fact ----
THEOREM T == FALSE
HIDE T
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
