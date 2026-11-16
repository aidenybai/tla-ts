(*---
description: Ported from TLC's ExamplesMCAlternatingBitTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesMCAlternatingBitTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |2-
    CONSTANT
       d1 = d1
       d2 = d2
       Data    = {d1, d2}
       msgQLen = 2
       ackQLen = 2

  SPECIFICATION ABSpec
  INVARIANT ABTypeInv 
  CONSTRAINT SeqConstraint

  PROPERTIES ABCSpec SentLeadsToRcvd 

  PROPERTY PermanentBitDisagreement

  \* TEMPORAL ABFairness

  \* IMPLIED-TEMPORAL SentLeadsToRcvd

  \* IMPLIED-INIT ABCInit

  \* IMPLIED-ACTION ImpliedAction 

  \* SYMMETRY DataPerm

  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - AlternatingBit.tla
  - ABCorrectness.tla
---*)
--------------------------- MODULE MCAlternatingBit -------------------------
EXTENDS AlternatingBit, TLC, TLCExt

INSTANCE ABCorrectness 

CONSTANTS msgQLen, ackQLen

SeqConstraint == /\ Len(msgQ) \leq msgQLen
                 /\ Len(ackQ) \leq ackQLen

SentLeadsToRcvd == \A d \in Data : (sent = d) /\ (sBit # sAck) ~> (rcvd = d)

PermanentBitDisagreement == <>[](sBit # rBit)

CONSTANT d1, d2

PostCondition ==
   CounterExample = 
   [ action |->
      { << << 1,
              [ msgQ |-> <<>>,
                ackQ |-> <<>>,
                sent |-> d1,
                sBit |-> 0,
                sAck |-> 0,
                rcvd |-> d1,
                rBit |-> 0 ] >>,
           [ name |-> "SndAck",
             location |->
                 [ beginLine |-> 47,
                   beginColumn |-> 11,
                   endLine |-> 48,
                   endColumn |-> 61,
                   module |-> "AlternatingBit" ] ],
           << 2,
              [ msgQ |-> <<>>,
                ackQ |-> <<0>>,
                sent |-> d1,
                sBit |-> 0,
                sAck |-> 0,
                rcvd |-> d1,
                rBit |-> 0 ] >> >>,
        << << 2,
              [ msgQ |-> <<>>,
                ackQ |-> <<0>>,
                sent |-> d1,
                sBit |-> 0,
                sAck |-> 0,
                rcvd |-> d1,
                rBit |-> 0 ] >>,
           [ name |-> "RcvAck",
             location |->
                 [ beginLine |-> 50,
                   beginColumn |-> 11,
                   endLine |-> 53,
                   endColumn |-> 55,
                   module |-> "AlternatingBit" ] ],
           << 1,
              [ msgQ |-> <<>>,
                ackQ |-> <<>>,
                sent |-> d1,
                sBit |-> 0,
                sAck |-> 0,
                rcvd |-> d1,
                rBit |-> 0 ] >> >> },
  state |->
      { << 1,
           [ msgQ |-> <<>>,
             ackQ |-> <<>>,
             sent |-> d1,
             sBit |-> 0,
             sAck |-> 0,
             rcvd |-> d1,
             rBit |-> 0 ] >>,
        << 2,
           [ msgQ |-> <<>>,
             ackQ |-> <<0>>,
             sent |-> d1,
             sBit |-> 0,
             sAck |-> 0,
             rcvd |-> d1,
             rBit |-> 0 ] >> } ]
=============================================================================

ImpliedAction == [ABCNext]_cvars

TNext == WF_msgQ(~ABTypeInv')
TProp == \A d \in Data : (sent = d) => [](sent = d)

CSpec == ABSpec /\ TNext

\* DataPerm == Permutations(Data)
==============================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 8 distinct states generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 720 total distinct states at (<date>)
    2116:1 Temporal property PermanentBitDisagreement was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ ackQ = <<>>
    /\ sAck = 0
    /\ msgQ = <<>>
    /\ sBit = 0
    /\ rcvd = d1
    /\ rBit = 0
    /\ sent = d1
    2217:4 2: <SndAck line 47, col 11 to line 48, col 61 of module AlternatingBit>
    /\ ackQ = <<0>>
    /\ sAck = 0
    /\ msgQ = <<>>
    /\ sBit = 0
    /\ rcvd = d1
    /\ rBit = 0
    /\ sent = d1
    2122:4 1: Back to state: <RcvAck line 50, col 11 to line 53, col 55 of module AlternatingBit>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 1392 states generated, 240 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
---*)
