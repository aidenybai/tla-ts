(*---
description: "EXCEPT works on the single key of :>."
ref: "tlc2/value/impl/FcnRcdValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE colon_greater_key ----
EXTENDS Integers, TLC
Test == [(7 :> 0) EXCEPT ![7] = 1][7] = 1
====

(*--- recorded
all:
  exit: 0
---*)
