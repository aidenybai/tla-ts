(*---
description: Ported from TLC's ExamplesCoffeeCan100BeansTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesCoffeeCan100BeansTest.java
features:
  - tlc-regression
outcome: success
config: |
  CONSTANTS
      MaxBeanCount = 100

  SPECIFICATION
      Spec

  PROPERTY
      EventuallyTerminates
      MonotonicDecrease
      LoopInvariant
      TerminationHypothesis

  INVARIANTS
      TypeInvariant
args:
  - -lncheck
  - final
  - -deadlock
---*)
---------------------------- MODULE CoffeeCan100Beans -------------------------------
(***************************************************************************)
(* This is a spec for the Coffee Can problem, a math problem usually       *)
(* attributed to David Gries in his 1987 book The Science of Programming.  *)
(* However, on page 301 section 23.2 of the same book Gries attributes the *)
(* problem to a 1979 letter by Edsger W. Dijkstra, who himself credits the *)
(* problem to his colleague Carel S. Scholten.                             *)
(*                                                                         *)
(* The problem as presented on page 165 of The Science of Programming:     *)
(*                                                                         *)
(* A coffee can contains some black beans and white beans. The following   *)
(* process is to be repeated as long as possible:                          *)
(*                                                                         *)
(* Randomly select two beans from the can. If they are the same color,     *)
(* throw them out, but put another black bean in. (Enough extra black      *)
(* beans are available to do this.) If they are different colors, place    *)
(* the white one back into the can and throw the black one away.           *)
(*                                                                         *)
(* Execution of this process reduces the number of beans in the can by     *)
(* one. Repetition of this process must terminate with exactly one bean in *)
(* the can, for then two beans cannot be selected. The question is: what,  *)
(* if anything, can be said about the color of the final bean based on the *)
(* number of white beans and the number of black beans initially in the    *)
(* can?                                                                    *)
(*                                                                         *)
(* We model this problem in TLA⁺ with a focus on two things:               *)
(*  1. Validate a monotonic decrease in number of beans at each step       *)
(*  2. Identify a loop/inductive invariant                                 *)
(*  3. Form a hypothesis about the final bean and modelcheck it            *)
(*                                                                         *)
(* Finite modelchecking can only check our properties for a finite number  *)
(* of beans, while we want to show that it holds for all Natural numbers.  *)
(* TLA⁺'s built-in proof language can be used for this purpose, although   *)
(* such a proof is not currently included in this spec.                    *)
(*                                                                         *)
(***************************************************************************)

EXTENDS Naturals

CONSTANT MaxBeanCount

ASSUME MaxBeanCount \in Nat /\ MaxBeanCount >= 1

VARIABLES can

\* The set of all possible cans
Can == [black : 0..MaxBeanCount, white : 0..MaxBeanCount]

\* Possible values the can variable can take on
TypeInvariant == can \in Can

\* Initialize can so it contains between 1 and MaxBeanCount beans
Init == can \in {c \in Can : c.black + c.white \in 1..MaxBeanCount}

\* Number of beans currently in the can
BeanCount == can.black + can.white

\* Pick two black beans; throw both away, put one black bean in
PickSameColorBlack ==
    /\ BeanCount > 1
    /\ can.black >= 2
    /\ can' = [can EXCEPT !.black = @ - 1]

\* Pick two white beans; throw both away, put one black bean in
PickSameColorWhite ==
    /\ BeanCount > 1
    /\ can.white >= 2
    /\ can' = [can EXCEPT !.black = @ + 1, !.white = @ - 2]

\* Pick one bean of each color; put white back, throw away black
PickDifferentColor ==
    /\ BeanCount > 1
    /\ can.black >= 1
    /\ can.white >= 1
    /\ can' = [can EXCEPT !.black = @ - 1]

\* Termination action to avoid triggering deadlock detection
Termination ==
    /\ BeanCount = 1
    /\ UNCHANGED can

\* Next-state relation: what actions can be taken?
Next ==
    \/ PickSameColorWhite
    \/ PickSameColorBlack
    \/ PickDifferentColor
    \/ Termination

\* Action formula: every step decreases the number of beans in the can
MonotonicDecrease == [][BeanCount' < BeanCount]_can

\* Liveness property: we eventually end up with one bean left
EventuallyTerminates == <>(ENABLED Termination)

\* Loop invariant: every step preserves white bean count mod 2
LoopInvariant == [][can.white % 2 = 0 <=> can'.white % 2 = 0]_can

\* Hypothesis: If we start out with an even number of white beans, we end up
\* with a single black bean. Otherwise, we end up with a single white bean.
TerminationHypothesis ==
    IF can.white % 2 = 0
    THEN <>(can.black = 1 /\ can.white = 0)
    ELSE <>(can.black = 0 /\ can.white = 1)

\* Start out in a state defined by the Init operator and every step is one
\* defined by the Next operator. Assume weak fairness so the system can't
\* stutter indefinitely: we eventually take some beans out of the can.
Spec ==
    /\ Init
    /\ [][Next]_can
    /\ WF_can(Next)

\* What we want to show: that if our system follows the rules set out by the
\* Spec operator, then all our properties and assumptions will be satisfied.
THEOREM Spec =>
    /\ TypeInvariant
    /\ MonotonicDecrease
    /\ EventuallyTerminates
    /\ LoopInvariant
    /\ TerminationHypothesis

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 5 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2269:0 Computed 1024 initial states...
    2269:0 Computed 2048 initial states...
    2269:0 Computed 4096 initial states...
    2190:0 Finished computing initial states: 5150 distinct states generated at <date>.
    2192:0 Checking 5 branches of temporal properties for the complete state space with 25750 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.1E-12
    2199:0 20002 states generated, 5150 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
