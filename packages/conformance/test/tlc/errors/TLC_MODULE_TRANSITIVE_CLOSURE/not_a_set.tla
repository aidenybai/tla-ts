(*---
description: A non-set argument hits the earlier wrong-value check instead.
ref: tlc2/module/TransitiveClosure.java#Warshall
outcome: evaluation-failure
config: ""
includes:
  - TransitiveClosure.tla
---*)
---- MODULE not_a_set ----
EXTENDS TransitiveClosure
ASSUME Warshall(1) = {}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    1
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    1
---*)
