(*---
description: "A key of only digits has no letter and is not a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE digits_key_is_not_name ----
EXTENDS Integers, TLC
Test == PrintT(("123" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("123" :> 1)'
---*)
