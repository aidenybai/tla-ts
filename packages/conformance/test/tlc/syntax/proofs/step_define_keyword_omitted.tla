(*---
description: A step may define an operator without DEFINE.
ref: "tla2sany/parser/TLAplusParser.java#Proof"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE step_define_keyword_omitted ----
THEOREM FALSE
<1> a == 1
<1>1. a = 1
<1> QED
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
