(*---
description: "A three-character key WF_ is shorter than the length the check applies to, so it is a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE wf_alone_is_name ----
EXTENDS Integers, TLC
Test == PrintT(("WF_" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [WF_ |-> 1]"
---*)
