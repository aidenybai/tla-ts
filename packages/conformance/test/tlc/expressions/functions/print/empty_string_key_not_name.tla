(*---
description: "The empty string has no letter and is not a name."
ref: "tlc2/value/impl/FcnRcdValue.java#isName"
flags: [expression]
outcome: success
---*)
---- MODULE empty_string_key_not_name ----
EXTENDS Integers, TLC
Test == PrintT(("" :> 1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ("" :> 1)'
---*)
