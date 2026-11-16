(*---
description: HIDE may appear outside a proof.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE hide_at_module_level ----
A == 1
HIDE DEF A
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
