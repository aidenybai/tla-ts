(*---
description: A module named TransitiveClosure picks up the Java Warshall, which rejects a relation holding a non-pair.
ref: tlc2/module/TransitiveClosure.java#Warshall
outcome: evaluation-failure
config: ""
includes:
  - TransitiveClosure.tla
---*)
---- MODULE element_not_a_pair ----
EXTENDS TransitiveClosure
ASSUME Warshall({1}) = {}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 25 of module element_not_a_pair failed.
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
---*)
