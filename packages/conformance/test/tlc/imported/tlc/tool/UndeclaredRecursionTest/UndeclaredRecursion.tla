(*---
description: Ported from TLC's UndeclaredRecursionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/UndeclaredRecursionTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - UndeclaredRecursion.tla
  - -deadlock
---*)
---- MODULE UndeclaredRecursion ----
EXTENDS Base, Integers

DefIsOdd(n) ==
	IF n = 0
	THEN FALSE
	ELSE IsEven(n-1)

=====
----- MODULE Base -----
EXTENDS Naturals

CONSTANT IsOdd(_)

IsEven(n) ==
	IF n = 0
	THEN TRUE
	ELSE IsOdd(n-1)

ASSUME IsEven(2)

====
---- CONFIG UndeclaredRecursion ----
CONSTANT IsOdd <- DefIsOdd
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
