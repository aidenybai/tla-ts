(*---
description: The printed order is normalized.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_print_order ----
EXTENDS TLC, Naturals
Test == PrintT(Permutations({3, 1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2, 3>>, <<1, 3, 2>>, <<2, 1, 3>>, <<2, 3, 1>>, <<3, 1, 2>>, <<3, 2, 1>>}"
---*)
