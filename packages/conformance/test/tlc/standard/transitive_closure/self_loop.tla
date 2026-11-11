(*---
description: A self-loop stays, and adds nothing else.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE self_loop ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 1>>}) = {<<1, 1>>}
====

(*--- recorded
all:
  exit: 0
---*)
