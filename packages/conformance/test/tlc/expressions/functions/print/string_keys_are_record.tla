(*---
description: "A function whose keys are all names prints as a record."
ref: "tlc2/value/impl/FcnRcdValue.java#isRcd"
flags: [expression]
outcome: success
---*)
---- MODULE string_keys_are_record ----
EXTENDS Integers, TLC
Test == PrintT(("zq" :> 1) @@ ("zr" :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [zq |-> 1, zr |-> 2]"
---*)
