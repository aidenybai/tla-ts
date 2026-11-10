(*---
description: Ported from TLC's Github597Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github597Test.java
features:
  - tlc-regression
outcome: liveness-violation
args:
  - -config
  - dekker.tla
  - -deadlock
---*)
---- CONFIG dekker ----
SPECIFICATION
    Spec
PROPERTIES
    Termination
    Tautology
CONSTANT
    Threads = {t1,t2,t3}
====
------------------------------- MODULE dekker -------------------------------
EXTENDS TLC, Integers
CONSTANT Threads

(*--algorithm dekker

variables 
  flag = [t \in Threads |-> FALSE],
  next_thread \in Threads;

define
  \* At most one thread is in the critical section at a time
  AtMostOneCritical == \A t1, t2 \in Threads:
    t1 /= t2 => ~(pc[t1] = "CS" /\ pc[t2] = "CS")
  
  \* All threads eventually reach the critical section
  Liveness == \A t \in Threads: <>(pc[t] = "CS")
end define;

fair process thread \in Threads
begin
  P1: flag[self] := TRUE;
  P2:
    while \E t \in Threads \ {self}: flag[t] do
      P2_1:
        if next_thread /= self then
          P2_1_1: flag[self] := FALSE;
          P2_1_2: await next_thread = self;
          P2_1_3: flag[self] := TRUE;
        end if;
    end while;
  CS: skip; \* CS means "critical section"
  P3: with t \in Threads \ {self} do
        next_thread := t;
      end with;
  P4: goto P1;
end process;

end algorithm;*)
\* BEGIN TRANSLATION
VARIABLES flag, next_thread, pc

(* define statement *)
AtMostOneCritical == \A t1, t2 \in Threads:
  t1 /= t2 => ~(pc[t1] = "CS" /\ pc[t2] = "CS")


Liveness == \A t \in Threads: <>(pc[t] = "CS")


vars == << flag, next_thread, pc >>

ProcSet == (Threads)

Init == (* Global variables *)
        /\ flag = [t \in Threads |-> FALSE]
        /\ next_thread \in Threads
        /\ pc = [self \in ProcSet |-> "P1"]

P1(self) == /\ pc[self] = "P1"
            /\ flag' = [flag EXCEPT ![self] = TRUE]
            /\ pc' = [pc EXCEPT ![self] = "P2"]
            /\ UNCHANGED next_thread

P2(self) == /\ pc[self] = "P2"
            /\ IF \E t \in Threads \ {self}: flag[t]
                  THEN /\ pc' = [pc EXCEPT ![self] = "P2_1"]
                  ELSE /\ pc' = [pc EXCEPT ![self] = "CS"]
            /\ UNCHANGED << flag, next_thread >>

P2_1(self) == /\ pc[self] = "P2_1"
              /\ IF next_thread /= self
                    THEN /\ pc' = [pc EXCEPT ![self] = "P2_1_1"]
                    ELSE /\ pc' = [pc EXCEPT ![self] = "P2"]
              /\ UNCHANGED << flag, next_thread >>

P2_1_1(self) == /\ pc[self] = "P2_1_1"
                /\ flag' = [flag EXCEPT ![self] = FALSE]
                /\ pc' = [pc EXCEPT ![self] = "P2_1_2"]
                /\ UNCHANGED next_thread

P2_1_2(self) == /\ pc[self] = "P2_1_2"
                /\ next_thread = self
                /\ pc' = [pc EXCEPT ![self] = "P2_1_3"]
                /\ UNCHANGED << flag, next_thread >>

P2_1_3(self) == /\ pc[self] = "P2_1_3"
                /\ flag' = [flag EXCEPT ![self] = TRUE]
                /\ pc' = [pc EXCEPT ![self] = "P2"]
                /\ UNCHANGED next_thread

CS(self) == /\ pc[self] = "CS"
            /\ TRUE
            /\ pc' = [pc EXCEPT ![self] = "P3"]
            /\ UNCHANGED << flag, next_thread >>

P3(self) == /\ pc[self] = "P3"
            /\ \E t \in Threads \ {self}:
                 next_thread' = t
            /\ pc' = [pc EXCEPT ![self] = "P4"]
            /\ flag' = flag

P4(self) == /\ pc[self] = "P4"
            /\ pc' = [pc EXCEPT ![self] = "P1"]
            /\ UNCHANGED << flag, next_thread >>

thread(self) == P1(self) \/ P2(self) \/ P2_1(self) \/ P2_1_1(self)
                   \/ P2_1_2(self) \/ P2_1_3(self) \/ CS(self) \/ P3(self)
                   \/ P4(self)

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == /\ \A self \in ProcSet: pc[self] = "Done"
               /\ UNCHANGED vars

Next == (\E self \in Threads: thread(self))
           \/ Terminating

Spec == /\ Init /\ [][Next]_vars
        /\ \A self \in Threads : WF_vars(thread(self))

Termination == <>(\A self \in ProcSet: pc[self] = "Done")

\* END TRANSLATION

Tautology == (vars = vars) ~> (vars = vars)
=============================================================================
\* Modification History
\* Last modified Sun Sep 29 12:39:24 PDT 2019 by tony
\* Created Sun Sep 29 12:18:45 PDT 2019 by tony

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 3 distinct states generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 3000 total distinct states at (<date>)
    2116:1 Temporal property Termination was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P1" @@ t2 :> "P1" @@ t3 :> "P1")
    2217:4 2: <P1(t2) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P1" @@ t2 :> "P2" @@ t3 :> "P1")
    2217:4 3: <P2(t2) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P1" @@ t2 :> "CS" @@ t3 :> "P1")
    2217:4 4: <CS(t2) line 112, col 13 to line 115, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P1" @@ t2 :> "P3" @@ t3 :> "P1")
    2217:4 5: <P3(t2) line 117, col 13 to line 121, col 27 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P1" @@ t2 :> "P4" @@ t3 :> "P1")
    2217:4 6: <P1(t1) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2" @@ t2 :> "P4" @@ t3 :> "P1")
    2217:4 7: <P1(t3) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2" @@ t2 :> "P4" @@ t3 :> "P2")
    2217:4 8: <P2(t1) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P4" @@ t3 :> "P2")
    2217:4 9: <P4(t2) line 123, col 13 to line 125, col 48 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P1" @@ t3 :> "P2")
    2217:4 10: <P2(t3) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P1" @@ t3 :> "P2_1")
    2217:4 11: <P1(t2) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P2" @@ t3 :> "P2_1")
    2217:4 12: <P2(t2) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P2_1" @@ t3 :> "P2_1")
    2217:4 13: <P2_1(t3) line 91, col 15 to line 95, col 50 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P2_1" @@ t3 :> "P2")
    2217:4 14: <P2_1(t2) line 91, col 15 to line 95, col 50 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P2_1_1" @@ t3 :> "P2")
    2217:4 15: <P2_1_1(t2) line 97, col 17 to line 100, col 40 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1" @@ t2 :> "P2_1_2" @@ t3 :> "P2")
    2217:4 16: <P2_1(t1) line 91, col 15 to line 95, col 50 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1_1" @@ t2 :> "P2_1_2" @@ t3 :> "P2")
    2217:4 17: <P2_1_1(t1) line 97, col 17 to line 100, col 40 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "P2")
    2217:4 18: <P2(t3) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "CS")
    2217:4 19: <CS(t3) line 112, col 13 to line 115, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "P3")
    2217:4 20: <P3(t3) line 117, col 13 to line 121, col 27 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "P4")
    2217:4 21: <P4(t3) line 123, col 13 to line 125, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "P1")
    2217:4 22: <P1(t3) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "P2")
    2217:4 23: <P2(t3) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_2" @@ t3 :> "CS")
    2217:4 24: <P2_1_2(t2) line 102, col 17 to line 105, col 52 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> FALSE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2_1_3" @@ t3 :> "CS")
    2217:4 25: <P2_1_3(t2) line 107, col 17 to line 110, col 40 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2" @@ t3 :> "CS")
    2217:4 26: <CS(t3) line 112, col 13 to line 115, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t2
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2" @@ t3 :> "P3")
    2217:4 27: <P3(t3) line 117, col 13 to line 121, col 27 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_2" @@ t2 :> "P2" @@ t3 :> "P4")
    2217:4 28: <P2_1_2(t1) line 102, col 17 to line 105, col 52 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P4")
    2217:4 29: <P4(t3) line 123, col 13 to line 125, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P1")
    2217:4 30: <P1(t3) line 80, col 13 to line 83, col 36 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P2")
    2217:4 31: <P2(t3) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P2_1")
    2217:4 32: <P2_1(t3) line 91, col 15 to line 95, col 50 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> TRUE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P2_1_1")
    2217:4 33: <P2_1_1(t3) line 97, col 17 to line 100, col 40 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "P2" @@ t3 :> "P2_1_2")
    2217:4 34: <P2(t2) line 85, col 13 to line 89, col 48 of module dekker>
    /\ flag = (t1 :> FALSE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2_1_3" @@ t2 :> "CS" @@ t3 :> "P2_1_2")
    2217:4 35: <P2_1_3(t1) line 107, col 17 to line 110, col 40 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2" @@ t2 :> "CS" @@ t3 :> "P2_1_2")
    2217:4 36: <CS(t2) line 112, col 13 to line 115, col 48 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t1
    /\ pc = (t1 :> "P2" @@ t2 :> "P3" @@ t3 :> "P2_1_2")
    2217:4 37: <P3(t2) line 117, col 13 to line 121, col 27 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2" @@ t2 :> "P4" @@ t3 :> "P2_1_2")
    2217:4 38: <P2_1_2(t3) line 102, col 17 to line 105, col 52 of module dekker>
    /\ flag = (t1 :> TRUE @@ t2 :> TRUE @@ t3 :> FALSE)
    /\ next_thread = t3
    /\ pc = (t1 :> "P2" @@ t2 :> "P4" @@ t3 :> "P2_1_3")
    2122:4 7: Back to state: <P2_1_3(t3) line 107, col 17 to line 110, col 40 of module dekker>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4356 states generated, 1500 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 25.
---*)
