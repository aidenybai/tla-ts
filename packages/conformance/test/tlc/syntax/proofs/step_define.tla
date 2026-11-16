(*---
description: A step may define an operator for later steps.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_define ----
THEOREM FALSE
<1> DEFINE a == 1
<1>1. a = 1
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
