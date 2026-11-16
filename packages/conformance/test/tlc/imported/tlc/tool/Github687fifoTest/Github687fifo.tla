(*---
description: Ported from TLC's Github687fifoTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github687fifoTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github687fifo.tla
  - -deadlock
---*)
-------------------------- MODULE Github687fifo --------------------------
EXTENDS Naturals, Sequences

CONSTANT Endpoints, Messages, MaxSize

VARIABLE channel

Init ==  channel \in [Endpoints -> {<<>>}]

Write(endpoint, message) ==
    /\ Len(channel[endpoint]) /= MaxSize
    /\ channel' = [channel EXCEPT ![endpoint] = Append(@, message)]

Read(endpoint) ==
    /\ channel[endpoint] /= <<>>
    /\ channel' = [channel EXCEPT ![endpoint] = Tail(@)]

Next == 
  \E endpoint \in Endpoints:
    \/ Read(endpoint)
    \/ \E message \in Messages:
        Write(endpoint, message)

Spec == Init /\ [][Next]_channel

RefinedQueue(endpoint) == INSTANCE FIFO WITH
    queue <- channel[endpoint]

\* This didn't work because of parametric instantiation
Refinement == 
	\A endpoint \in Endpoints :
		RefinedQueue(endpoint)!Spec
===========================================================================

---------------------------- MODULE FIFO ----------------------------
EXTENDS Sequences

CONSTANT Messages

VARIABLE queue

Init == queue = <<>>

Put(message) == queue' = Append(queue, message)

Get ==
    /\ queue /= <<>>
    /\ queue' = Tail(queue)

Next ==
    \/ \E message \in Messages: Put(message)
    \/ Get

Spec == Init /\ [][Next]_queue
===========================================================================

-------------------------- CONFIG Github687fifo --------------------------
SPECIFICATION Spec
CONSTANTS
    Endpoints = { E0, E1 }
    Messages = { M0, M1}
    MaxSize = 2
PROPERTY Refinement
===========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.2E-16
    2199:0 169 states generated, 49 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 5.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 4).
---*)
