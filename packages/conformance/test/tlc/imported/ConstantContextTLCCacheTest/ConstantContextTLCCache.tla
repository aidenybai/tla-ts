(*---
description: Ported from TLC's ConstantContextTLCCacheTest.
source: tlatools/org.lamport.tlatools/test/tlc2/module/ConstantContextTLCCacheTest.java
features:
  - tlc-regression
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -deadlock
---*)
---- MODULE ConstantContextTLCCache ----
EXTENDS Integers, TLC, TLCExt

(* Maintain a global counter, incremented whenever inc(...)
 * is referenced. We use this to figure out how often a given
 * expression was evaluated. *)

COUNT_ID == 1

ASSUME TLCSet(COUNT_ID, 0)

inc(v) ==
    CASE TLCSet(COUNT_ID, TLCGet(COUNT_ID) + 1) -> v

defn == TLCCache(inc({ x : x \in 1 .. 5 }), {1})
derivedDefn == TLCCache(inc({ i \in 1 .. 5 : i + 1 \in defn }), {2})

(* Below is a simple spec that references the 2 definitions, defn
 * and derivedDefn. Both should be evaluated exactly once, regardless
 * of being referenced by assumptions, the init state, and the next state.
 * Note: the trick of asserting whether 5 is in the definition will catch
 *       the case of accidentally caching one value in place of the other. *)

VARIABLE x, y

ASSUME 5 \in defn
ASSUME 5 \notin derivedDefn

Init ==
    /\ y = defn
    /\ x = derivedDefn

Next ==
    /\ 1 \in defn
    /\ 1 \in derivedDefn
    (* Assert the global counter here, after all defns will have been
     * referenced during normal evaluation order. *)
    /\ Assert(TLCGet(COUNT_ID) = 2, <<"count was", TLCGet(COUNT_ID)>>)
    /\ UNCHANGED <<x, y>>

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
