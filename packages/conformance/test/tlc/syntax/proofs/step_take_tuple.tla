(*---
description: A TAKE step may bind a tuple.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_take_tuple ----
THEOREM FALSE
<1> TAKE <<x, y>> \in {<<1, 2>>}
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
