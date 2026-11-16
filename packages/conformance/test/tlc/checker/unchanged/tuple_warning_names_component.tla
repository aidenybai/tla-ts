(*---
description: "A changed component of a tuple warns about that component only, and the remaining components aren't reached, leaving a deadlock."
ref: tlc2/tool/impl/Tool.java#processUnchangedImplVar
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE tuple_warning_names_component ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 1
Next == x' = 5 /\ UNCHANGED <<x, y>>
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2143:3 The variable x was changed while it is specified as UNCHANGED at
    line 13, col 31 to line 13, col 31 of module tuple_warning_names_component
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 1
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
