(*---
description: BY followed by a fact is accepted and unchecked.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE by_nothing_in_particular ----
THEOREM FALSE BY TRUE
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
