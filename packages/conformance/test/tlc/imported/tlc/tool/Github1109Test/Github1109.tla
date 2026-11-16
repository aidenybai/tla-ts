(*---
description: Ported from TLC's Github1109Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1109Test.java
features:
  - tlc-regression
outcome: assumption-violation
args:
  - -config
  - Github1109.tla
  - -deadlock
---*)
---------------------------- MODULE Github1109 ---------------------------
EXTENDS Sequences

Part_Funct(D, R) == UNION {[d -> R] : d \in SUBSET D}

S == {"s"}

R == Seq(S) \* Cannot be enumerated.

CONSTANTS C

ASSUME DOMAIN C # {} \* Evaluate C to trigger Seq(S).

C2 == [ s \in [S -> R], p \in {Part_Funct(S, R)} |-> TRUE ]
==========================================================================
---------------------------- CONFIG Github1109 ---------------------------
CONSTANT C <- C2
==========================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 23, col 8 to line 23, col 20 of module Github1109 failed.
    Attempted to enumerate a set of the form [D -> R],but the range R:
    Seq({"s"})
    cannot be enumerated.
---*)
