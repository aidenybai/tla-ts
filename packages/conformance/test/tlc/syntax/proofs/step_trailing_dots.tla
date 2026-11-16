(*---
description: Any run of dots may follow a step name.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_trailing_dots ----
THEOREM FALSE
<1>1... TRUE
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
