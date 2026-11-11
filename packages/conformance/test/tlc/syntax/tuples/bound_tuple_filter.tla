(*---
description: A set filter may bind a tuple pattern.
ref: "tla2sany/parser/TLAplusParser.java#matchFcnConst"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_tuple_filter ----
Test == {<<x, y>> \in {<<1, 2>>} : x = 1} = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
