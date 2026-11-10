(*---
description: Ported from TLC's ActionLevelPropCTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/ActionLevelPropCTest.java
features:
  - tlc-regression
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY ActionLivePropC
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
  transcript: "2272:1 The formula ActionLivePropC at line 38, col 5 to line 38, col 26 of module ActionLevelProp is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action ActionLivePropC holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 38, col 5 to line 38, col 26 of module ActionLevelProp; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
