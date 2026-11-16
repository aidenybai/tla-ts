(*---
description: "A key with a letter, digits and underscores is a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE underscore_digit_key_is_name ----
EXTENDS Integers, TLC
Test == PrintT(("a_1" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a_1 |-> 1]"
---*)
