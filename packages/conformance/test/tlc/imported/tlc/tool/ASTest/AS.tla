(*---
description: Ported from TLC's ASTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/ASTest.java
features:
  - tlc-regression
outcome: evaluation-failure
config: |
  \* CONSTANT definitions
  CONSTANT
  c = 4
  \* SPECIFICATION definition
  SPECIFICATION
  ASInit
args:
  - -deadlock
---*)
--------------------------------- MODULE AS ---------------------------------
EXTENDS Integers, FiniteSets

CONSTANT c
ASSUME c \in Nat \ {0}

R == -42


VARIABLES x, z

ASTypeOK == /\ x \in 1..c \cup {R}
            /\ z \subseteq 1..c

ASInit == /\ x = R
          /\ z = {}

ASChoose == /\ Cardinality(z) # c 
            /\ \E n \in 1..c \ z : /\ x' = n
                                   /\ z' = z \cup {n}

ASRest == /\ Cardinality(z) = c
          /\ x' = R
          /\ z' = {}

ASNext == ASChoose \/ ASRest

AS == ASInit /\ [][ASNext]_<<x, z>>

=============================================================================

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2115:1 No next state actions defined to generate successor states from.
---*)
