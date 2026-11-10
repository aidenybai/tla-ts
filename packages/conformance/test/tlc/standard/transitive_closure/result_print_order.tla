(*---
description: The result is a normalized set when printed.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE result_print_order ----
EXTENDS TransitiveClosure, TLC
Test == PrintT(Warshall({<<3, 1>>, <<1, 2>>}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<3, 1>>, <<3, 2>>}"
---*)
