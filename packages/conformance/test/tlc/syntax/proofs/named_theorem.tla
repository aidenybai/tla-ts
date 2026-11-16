(*---
description: A theorem may have a name.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE named_theorem ----
THEOREM T == FALSE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
