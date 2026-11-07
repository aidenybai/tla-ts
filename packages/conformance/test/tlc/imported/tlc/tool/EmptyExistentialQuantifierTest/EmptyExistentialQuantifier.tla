(*---
description: Ported from TLC's EmptyExistentialQuantifierTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/EmptyExistentialQuantifierTest.java
features:
  - tlc-regression
outcome: deadlock
args:
  - -config
  - EmptyExistentialQuantifier.tla
---*)
--------------------------- MODULE EmptyExistentialQuantifier --------------
VARIABLE N

Init == N = 1

Next == \E i \in {} : UNCHANGED N             \* \E i \in {}: ... <=> FALSE

Spec == Init /\ [][Next]_<< N >>

THEOREM Spec => []TRUE                        \* Due to subscript <<N>> in [][...]_<<N>>
============================================================================

---- CONFIG EmptyExistentialQuantifier ----
SPECIFICATION Spec
======

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    N = 1
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
