(*---
description: "Functions sort by size first."
ref: "tlc2/value/impl/FcnRcdValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE functions_by_size ----
EXTENDS Integers, TLC
Test == PrintT({(1 :> 1 @@ 2 :> 1), (9 :> 0)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 0), <<1, 1>>}"
---*)
