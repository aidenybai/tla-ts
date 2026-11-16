(*---
description: Nodes can be strings.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE strings ----
EXTENDS TransitiveClosure
Test == Warshall({<<"a", "b">>, <<"b", "c">>}) = {<<"a", "b">>, <<"b", "c">>, <<"a", "c">>}
====

(*--- recorded
all:
  exit: 0
---*)
