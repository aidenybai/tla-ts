(*---
description: "A BY fact may be a false expression, since neither the theorem nor its proof runs."
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_fact_false_expression ----
A == 1
THEOREM FALSE BY A = 2
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
