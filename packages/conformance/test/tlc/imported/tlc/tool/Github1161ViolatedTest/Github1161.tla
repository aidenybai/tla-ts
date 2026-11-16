(*---
description: Ported from TLC's Github1161ViolatedTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1161ViolatedTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION SPEC
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- Test
  CONSTANT Op2 <- Test
  PROPERTY PropertyViolated
  PROPERTY Tautology
args:
  - -deadlock
---*)
---------------------------- MODULE Github1161 ----------------------------
EXTENDS Naturals
VARIABLE s

CONSTANT Op(_)
CONSTANT Op2(_)

abs == INSTANCE Github1161Abstract

Init == s = 0

Next == IF s < 8 THEN s' = s + 1 ELSE s' = 0

SPEC == Init /\ [][Next]_s

Test(e) == TRUE

Test2(e) == e \in 0..8

RECURSIVE RecOp(_)
RecOp(n) == IF n = 0 THEN TRUE ELSE RecOp(n - 1)

\* All properties below route through Double-style wrappers in the abstract
\* module so that processConfigProps inlines the outer operator but cannot
\* inline the inner call (subs is non-empty due to the INSTANCE SubstInNode).
\* This ensures astToLiveAppl's argument-binding loop is exercised.

\* Property passed through a single parameterized operator from the abstract module.
Property == abs!Property(Test, s)

\* Property passed through two nested parameterized operators from the abstract module.
Double == abs!Double(Test, s)

\* Property with only a state-variable argument (no operator argument) from the abstract module.
StateProperty == abs!DoubleStateProp(s)

\* Operator argument that uses its parameter (unlike Test which ignores it).
PropertyF == abs!Double(Test2, s)

\* Recursive operator passed as operator argument.
PropertyH == abs!Double(RecOp, s)

\* CONSTANT operator passed as operator argument through INSTANCE.
PropertyG == abs!Double(Op, s)

\* Operator defined in the abstract module, passed through abs!Test3.
PropertyE == abs!Double(abs!Test3, s)

\* Recursive operator whose predicate is violated (returns FALSE for n >= 5).
RECURSIVE RecViolated(_)
RecViolated(n) == IF n = 5 THEN FALSE ELSE IF n = 0 THEN TRUE ELSE RecViolated(n - 1)
PropertyViolated == abs!Double(RecViolated, s)

Tautology == (s = s) ~> (s = s)

==========================================================================

--------------------------- MODULE Github1161Abstract --------------------
EXTENDS Naturals
VARIABLE s
CONSTANT Op2(_)

Init == s = 0

Next == s' \in (0..8)

SPEC == Init /\ [][Next]_s

Property(ns(_), a) == [](ns(a))

Double(ns(_), a) == Property(ns, a)

StateProp(a) == [](a \in 0..8)

DoubleStateProp(a) == StateProp(a)

Test3(e) == TRUE

==========================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property PropertyViolated was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    s = 0
    2217:4 2: <Next line 28, col 9 to line 28, col 44 of module Github1161>
    s = 1
    2217:4 3: <Next line 28, col 9 to line 28, col 44 of module Github1161>
    s = 2
    2217:4 4: <Next line 28, col 9 to line 28, col 44 of module Github1161>
    s = 3
    2217:4 5: <Next line 28, col 9 to line 28, col 44 of module Github1161>
    s = 4
    2217:4 6: <Next line 28, col 9 to line 28, col 44 of module Github1161>
    s = 5
    2199:0 7 states generated, 7 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 7.
---*)
