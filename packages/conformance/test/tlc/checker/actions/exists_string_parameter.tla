(*---
description: A string parameter prints with its quotes in the action name.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_string_parameter ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
A(s) == x' = IF s = "a" THEN 1 ELSE 2
Next == \E s \in {"b", "a"} : A(s)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <A("a") line 15, col 9 to line 15, col 37 of module exists_string_parameter>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
