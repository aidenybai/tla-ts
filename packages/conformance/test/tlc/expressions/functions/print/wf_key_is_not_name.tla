(*---
description: "A key starting with WF_ is not a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE wf_key_is_not_name ----
EXTENDS Integers, TLC
Test == PrintT(("WF_x" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("WF_x" :> 1)'
---*)
