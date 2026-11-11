(*---
description: "A key with a space is not a name, so the function prints with :>."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE non_name_key_is_colon_greater ----
EXTENDS Integers, TLC
Test == PrintT(("a b" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("a b" :> 1)'
---*)
