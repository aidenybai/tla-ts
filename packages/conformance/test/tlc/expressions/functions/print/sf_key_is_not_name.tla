(*---
description: "A key starting with SF_ is not a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE sf_key_is_not_name ----
EXTENDS Integers, TLC
Test == PrintT(("SF_x" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("SF_x" :> 1)'
---*)
