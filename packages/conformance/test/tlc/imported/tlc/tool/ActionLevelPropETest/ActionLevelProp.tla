(*---
description: Ported from TLC's ActionLevelPropETest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/ActionLevelPropETest.java
features:
  - tlc-regression
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY ActionLivePropE
args:
  - -deadlock
---*)
---- MODULE ActionLevelProp ----
EXTENDS Naturals

VARIABLE x
vars == x

Init ==
    x = 0

Next ==
    /\ x < 5
    /\ x' = x + 1

Spec ==
    Init /\ [][Next]_vars

------

ActionLivePropA ==
    x' > x

ActionLivePropB ==
	Next

ActionLivePropC ==
    Next \/ UNCHANGED vars

ActionLivePropD ==
    [Next]_vars

ActionLivePropE ==
    <<Next>>_vars

=============================================================================
The following formulas are state level and, thus, out of scope.
    ENABLED Next
    ENABLED [Next]_vars
    ENABLED <<Next>>_vars

(*--- recorded
all:
  exit: 151
  transcript: 2274:1 The formula ActionLivePropE at line 44, col 5 to line 44, col 17 of module ActionLevelProp is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that infinitely many ActionLivePropE steps occur, define a temporal property by applying the "always eventually" temporal operator combination ([]<>) to the formula at line 44, col 5 to line 44, col 17 of module ActionLevelProp (compare page 91 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
---*)
