(*---
description: A step may hold a deeper proof.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_nested ----
THEOREM FALSE
<1>1. TRUE
  <2>1. TRUE
  <2> QED
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
