(*---
description: A tuple of three isn't a pair either.
ref: tlc2/module/TransitiveClosure.java#Warshall
outcome: evaluation-failure
config: ""
includes:
  - TransitiveClosure.tla
---*)
---- MODULE triple_not_a_pair ----
EXTENDS TransitiveClosure
ASSUME Warshall({<<1, 2, 3>>}) = {}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    <<1, 2, 3>>
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    <<1, 2, 3>>
---*)
