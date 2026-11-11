(*---
description: A step may be used in a later BY by name.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_refers_to_earlier ----
THEOREM FALSE
<1>1. TRUE
<1>2. TRUE BY <1>1
<1> QED BY <1>1, <1>2
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
