(*---
description: Ported from TLC's CodePlexBug08EWD840FL4Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/CodePlexBug08EWD840FL4Test.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  CONSTANT
  N <- const_123
  SPECIFICATION
  Spec
  PROPERTY
  AllNodesTerminateIfNoMessages
  PROPERTY neg_AllNodesTerminateIfNoMessages
  PROPERTY Tautology
args:
  - -deadlock
includes:
  - EWD840.tla
  - EWD840MC2_TTrace_2000000000_Expected.json
---*)
---- MODULE EWD840MC4 ----
EXTENDS EWD840, TLC

const_123 == 4

neg_AllNodesTerminateIfNoMessages == ~AllNodesTerminateIfNoMessages

Tautology == (vars = vars) ~> (vars = vars)
===================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2190:0 Finished computing initial states: 1024 distinct states generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 6264 total distinct states at (<date>)
    2116:1 Temporal property AllNodesTerminateIfNoMessages was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ tpos = 0
    /\ active = (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE)
    /\ tcolor = "black"
    /\ color = (0 :> "white" @@ 1 :> "white" @@ 2 :> "white" @@ 3 :> "white")
    2217:4 2: <InitiateProbe line 30, col 3 to line 35, col 43 of module EWD840>
    /\ tpos = 3
    /\ active = (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE)
    /\ tcolor = "white"
    /\ color = (0 :> "white" @@ 1 :> "white" @@ 2 :> "white" @@ 3 :> "white")
    2218:4 3: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 15986 states generated, 1566 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 12.
---*)
