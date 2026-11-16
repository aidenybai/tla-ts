(*---
description: "A BY clause may name a theorem's label."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_names_theorem_label ----
THEOREM T == l:: FALSE
<1>1. TRUE
<1> QED BY T!l
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
