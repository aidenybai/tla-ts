(*---
description: Ported from TLC's PossibleFailNoTransTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PossibleFailNoTransTest.java
features:
  - tlc-regression
outcome: assumption-violation
config: |
  SPECIFICATION SpecOnlyInit
  _POSSIBLE BigJump
args:
  - -deadlock
---*)
---- MODULE PossibleFail ----
EXTENDS Naturals
VARIABLE x

Init == x = 0

Next == x' = (x + 1) % 3

\* State-level predicates.
AtOne       == x = 1
AllDone     == x = 2
Unreachable == x = 5     \* never true: reachable values of x are 0, 1, 2

\* Action-level predicates.
WrapAround == x = 2 /\ x' = 0
BigJump    == x' = x + 2 \* never true: Next only increments x by 1 mod 3

Spec == Init /\ [][Next]_x

\* Used by PossibleFailNoTransTest to exercise the edge case where there are
\* no transitions at all (only initial states).  Action-level predicates wired
\* through actionConstraints are never evaluated for such a spec, so the name
\* is never inserted into _Counts -- _CheckName must still report the failure.
NoNext       == FALSE
SpecOnlyInit == Init /\ [][NoNext]_x
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<>>
    2780:1 The _POSSIBLE predicate BigJump at line 28, col 15 to line 28, col 24 of module PossibleFail was never witnessed.
    Others may be unwitnessed too; only witnessed predicates appear with a
    non-zero count in the record printed above.
    See https://explain.tlapl.us/possible-conditions for additional details.
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
