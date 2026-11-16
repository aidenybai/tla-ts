(*---
description: A step name may contain letters.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_named_with_letters ----
THEOREM FALSE
<1>a. TRUE
<1>b1. TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
