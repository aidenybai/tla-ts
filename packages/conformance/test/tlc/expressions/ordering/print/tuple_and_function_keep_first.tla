(*---
description: "Normalization keeps the first of a tuple and an equal function."
ref: "tlc2/value/impl/ValueVec.java#sort"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_and_function_keep_first ----
EXTENDS Integers, TLC
Test == PrintT({<<1>>, (1 :> 1)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1>>}"
---*)
