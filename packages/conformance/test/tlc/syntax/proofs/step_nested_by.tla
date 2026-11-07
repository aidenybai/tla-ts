(*---
description: A step may be proved by BY.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_nested_by ----
THEOREM FALSE
<1>1. TRUE BY TRUE
<1> QED BY <1>1
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
