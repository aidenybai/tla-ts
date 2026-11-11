(*---
description: The result does not depend on the order the edges enumerate in.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE reverse_order_chain ----
EXTENDS TransitiveClosure
Test == Warshall({<<3, 4>>, <<2, 3>>, <<1, 2>>}) = Warshall({<<1, 2>>, <<2, 3>>, <<3, 4>>})
====

(*--- recorded
all:
  exit: 0
---*)
