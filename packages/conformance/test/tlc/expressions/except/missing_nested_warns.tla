(*---
description: "A missing inner key leaves the value unchanged."
ref: "tlc2/value/impl/Value.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE missing_nested_warns ----
EXTENDS Integers
Test == [<<<<1>>>> EXCEPT ![1][5] = 0] = <<<<1>>>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 18 of module missing_nested_warns
---*)
