(*---
description: USE may take an expression as a fact.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE use_expression_as_fact ----
USE 1 = 1
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
