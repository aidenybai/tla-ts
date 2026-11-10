(*---
description: Ported from TLC's ExamplesNbacgGuer01Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesNbacgGuer01Test.java
features:
  - tlc-regression
outcome: liveness-violation
config: |+
  CONSTANT N = 3
  INVARIANT TypeOK
  PROPERTIES AgrrLtl AbortValidityLtl CommitValidityLtl TerminationLtl AllCommit
  SPECIFICATION Spec

args:
  - -lncheck
  - final
  - -deadlock
---*)
------------------------------ MODULE nbacg_guer01 ------------------------------

(* An encoding of a parameterized model of the asynchronous non-blocking atomic commitment 
   algorithm with failure detectors in TLA+. The algorithm is described in the following paper:
 
   [1] Guerraoui, Rachid. "On the hardness of failure-sensitive agreement problems." Information 
   Processing Letters 79.2 (2001): 99-104.
 
   Thanh Hai Tran, Igor Konnov, Josef Widder, 2016
 
   This file is a subject to the license that is bundled together with this package and can 
   be found in the file LICENSE.
 *)


EXTENDS Naturals, FiniteSets

CONSTANTS N

VARIABLES nSntNo,     (* the number of YES messages sent by correct processes *)
          nSntYes,    (* the number of NO messages sent by correct processes *)
          nSntNoF,    (* the upper bound of the number of NO messages sent by faulty processes *)
          nSntYesF,   (* the upper bound of the number of NO messages sent by faulty processes *)
          nRcvdYes,   (* the number of Yes messages which have been received *)
          nRcvdNo,    (* the number of NO messages which have been received *)
          someFail,   (* a failure detector satisfies: 
                          - every faulty processes is permanently suspected 
                          - no process is suspected unless it crashes *)
          pc          (* process counters *)
                          

Proc == 1 .. N
Status == { "YES", "NO", "SENT", "ABORT", "COMMIT", "BYZ" }
vars == << nSntNo, nSntYes, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail, pc >>



Init ==  
  /\ nSntNo = 0                         (* no message has been sent or received *)
  /\ nSntYes = 0
  /\ nSntNoF = 0 
  /\ nSntYesF = 0    
  /\ nRcvdYes = [ i \in Proc |-> 0 ]
  /\ nRcvdNo = [ i \in Proc |-> 0 ]  
  /\ pc \in [ Proc -> { "NO", "YES" } ] (* a process can vote YES or NO *)
  /\ someFail \in [ Proc -> BOOLEAN ]   (* initialization of failure detector *)
  
InitYes ==  
  /\ nSntNo = 0                         (* no message has been sent or received *)  
  /\ nSntYes = 0
  /\ nSntNoF = 0
  /\ nSntYesF = 0    
  /\ nRcvdYes = [ i \in Proc |-> 0 ]    
  /\ nRcvdNo = [ i \in Proc |-> 0 ]  
  /\ pc \in [ Proc -> { "YES" } ]       (* all processes vote YES *)
  /\ someFail \in [ Proc -> BOOLEAN ]   (* initialization of failure detector *)
  
InitNo ==  
  /\ nSntNo = 0                         (* no message has been sent or received *)
  /\ nSntYes = 0
  /\ nSntNoF = 0
  /\ nSntYesF = 0    
  /\ nRcvdYes = [ i \in Proc |-> 0 ]
  /\ nRcvdNo = [ i \in Proc |-> 0 ]  
  /\ pc \in [ Proc -> { "NO" } ]        (* all processes vote NO *)
  /\ someFail \in [ Proc -> BOOLEAN ]   (* initialization of failure detector *)
  
(* Some process will crash in the next state. If the process has not proposed its initial 
   value, the upper bound of the number of messages with the same value will be increased. 
 *)  
Crash(i) ==
  /\ pc[i] # "BYZ"                      
  /\ pc' = [ pc EXCEPT ![i] = "BYZ" ]
  /\ IF pc[i] = "YES"
     THEN nSntYesF' = nSntYesF + 1
     ELSE nSntYesF' = nSntYesF
  /\ IF pc[i] = "NO"
     THEN nSntNoF' = nSntNoF + 1
     ELSE nSntNoF' = nSntNoF      
  /\ UNCHANGED << nSntNo, nSntYes, nRcvdNo, nRcvdYes, someFail >>

(* A process starts receiving messages after sending its vote. If a process crashed or decides, 
   it stops receiving messages. 
 *)    
Receive(i) ==
  \/ /\ pc[i] = "SENT"
     /\ nRcvdYes[i] < nSntYes + nSntYesF    (* receives a YES message *)                       
     /\ nRcvdYes' = [ nRcvdYes EXCEPT ![i] = nRcvdYes[i] + 1 ]
     /\ UNCHANGED << nSntYes, nSntNo, nSntYesF, nSntNoF, nRcvdNo, someFail, pc >>     
  \/ /\ pc[i] = "SENT"
     /\ nRcvdNo[i] < nSntNo + nSntNoF       (* receives a NO message *)
     /\ nRcvdNo' = [ nRcvdNo EXCEPT ![i] = nRcvdNo[i] + 1 ]
     /\ UNCHANGED << nSntYes, nSntNo, nSntYesF, nSntNoF, nRcvdYes, someFail, pc >>  
  \/ /\ pc[i] = "SENT"
     /\ nRcvdYes[i] =  nSntYes + nSntYesF     (* all messages are received *) 
     /\ nRcvdNo[i] = nSntNo + nSntNoF  
     /\ UNCHANGED vars                       (* this conditions is added to avoid deadlocks *)       

(* A correct process sends YES messages to all processes. *)
SendYes(i) ==
  /\ pc[i] = "YES"    
  /\ someFail[i] = FALSE
  /\ pc' = [ pc EXCEPT ![i] = "SENT" ]
  /\ nSntYes' = nSntYes + 1
  /\ UNCHANGED << nSntNo, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail >>
  
(* A correct process sends NO messages to all processes. *)  
SendNo(i) ==
  /\ pc[i] = "NO"   
  /\ someFail[i] = FALSE 
  /\ pc' = [ pc EXCEPT ![i] = "SENT" ]
  /\ nSntNo' = nSntNo + 1
  /\ UNCHANGED << nSntYes, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail >>  
  
(* A suspicious process aborts. *)
AbortNoYes(i) ==
  /\ someFail[i] = TRUE
  /\ \/ pc[i] = "YES"
     \/ pc[i] = "NO" 
  /\ pc' = [ pc EXCEPT ![i] = "ABORT" ]
  /\ UNCHANGED << nSntNo, nSntYes, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail >>
  
(* A correct process aborts after it received a NO message *)  
AbortSent(i) ==
  /\ pc[i] = "SENT"
  /\ nRcvdNo[i] > 0  
  /\ pc' = [ pc EXCEPT ![i] = "ABORT" ]
  /\ UNCHANGED << nSntNo, nSntYes, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail >>   

(* A correct process commits since it knows that all processes propose YES *)     
Commit(i) ==
  /\ pc[i] = "SENT"     
  /\ nRcvdNo[i] = 0
  /\ nRcvdYes[i] >= N
  /\ pc' = [ pc EXCEPT ![i] = "COMMIT" ]
  /\ UNCHANGED << nSntNo, nSntYes, nSntYesF, nSntNoF, nRcvdNo, nRcvdYes, someFail >>
  
Next ==
  /\ \E self \in Proc : 
        \/ Crash(self)
        \/ Receive(self)
        \/ SendYes(self) 
        \/ SendNo(self) 
        \/ AbortNoYes(self)
        \/ AbortSent(self)
        \/ Commit(self)  
        \/ UNCHANGED vars     (* Avoid deadlocks. 
                                 After deciding, a correct process does nothing. *)
                   

(* 
  In this specification, a process can vote YES or NO. Weak fairness condition is added 
  since we want to check liveness properties.        
 *)
Spec == Init /\ [][Next]_vars 
             /\ WF_vars(\E self \in Proc : 
                  \/ Receive(self)                 
                  \/ SendYes(self) 
                  \/ SendNo(self) 
                  \/ AbortNoYes(self)
                  \/ AbortSent(self)
                  \/ Commit(self))   

                                           
(* All processes vote YES. *)                                           
SpecYes == InitYes /\ [][Next]_vars 
                   /\ WF_vars(\E self \in Proc : 
                                  \/ Receive(self)                 
                                  \/ SendYes(self) 
                                  \/ SendNo(self) 
                                  \/ AbortNoYes(self)
                                  \/ AbortSent(self)
                                  \/ Commit(self))

(* All processes vote NO. *)                                             
SpecNo == InitNo /\ [][Next]_vars 
                 /\ WF_vars(\E self \in Proc : 
                                \/ Receive(self)                 
                                \/ SendYes(self) 
                                \/ SendNo(self) 
                                \/ AbortNoYes(self)
                                \/ AbortSent(self)
                                \/ Commit(self))


(* Type invariant *)
TypeOK == 
  /\ nSntNo \in 0..N
  /\ nSntYes \in 0..N
  /\ nSntNoF \in 0..N
  /\ nSntYesF \in 0..N    
  /\ nRcvdYes \in [ Proc -> 0..(nSntYes + nSntYesF) ]
  /\ nRcvdNo \in [ Proc -> 0..(nSntNo + nSntNoF) ] 
  /\ pc \in [ Proc -> Status ]
  /\ someFail \in [ Proc -> BOOLEAN ]      
   
(* No two correct processes decide differently. *)   
AgrrLtl ==
  [](~(\E i \in Proc, j \in Proc :  pc[i] = "COMMIT" /\ pc[j] = "ABORT"))
  
(* If some process votes NO, no process commits. *)  
AbortValidityLtl ==
  (\E i \in Proc : pc[i] = "NO") => [](\A i \in Proc : pc[i] # "COMMIT")
    
(* If every processes votes YES and no process is suspected, then no process crashes or aborts. *)    
CommitValidityLtl ==
  (\A i \in Proc : pc[i] = "YES" /\ someFail[i] = FALSE) => [](\A i \in Proc : pc[i] = "BYZ" \/ pc[i] # "ABORT")    
  
(* If no process crashes or is suspicious, then every process eventually commits. *)  
TerminationLtl ==
  ([](\A i \in Proc : pc[i] # "BYZ" /\ someFail[i] = FALSE)) => <>(\A i \in Proc : pc[i] = "COMMIT" \/ pc[i] = "ABORT")      

AllCommit == \A self \in Proc : <>(pc[self] = "COMMIT")

=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 6 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2190:0 Finished computing initial states: 64 distinct states generated at <date>.
    2192:0 Checking 6 branches of temporal properties for the complete state space with 149532 total distinct states at (<date>)
    2116:1 Temporal property AllCommit was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ nSntYesF = 0
    /\ nSntYes = 0
    /\ nSntNoF = 0
    /\ nRcvdYes = <<0, 0, 0>>
    /\ nSntNo = 0
    /\ pc = <<"YES", "YES", "YES">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 2: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 1
    /\ nSntNoF = 0
    /\ nRcvdYes = <<0, 0, 0>>
    /\ nSntNo = 0
    /\ pc = <<"YES", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 3: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<0, 0, 0>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 4: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<0, 0, 1>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 5: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<1, 0, 1>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 6: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<1, 0, 2>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 7: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 0
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<2, 0, 2>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "YES", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 8: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 1
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<2, 0, 2>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "BYZ", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 9: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 1
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<2, 0, 3>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "BYZ", "SENT">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 10: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 1
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<2, 0, 3>>
    /\ nSntNo = 0
    /\ pc = <<"SENT", "BYZ", "BYZ">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2217:4 11: <Next line 156, col 3 to line 164, col 25 of module nbacg_guer01>
    /\ nSntYesF = 1
    /\ nSntYes = 2
    /\ nSntNoF = 0
    /\ nRcvdYes = <<2, 0, 3>>
    /\ nSntNo = 0
    /\ pc = <<"BYZ", "BYZ", "BYZ">>
    /\ nRcvdNo = <<0, 0, 0>>
    /\ someFail = <<FALSE, FALSE, FALSE>>
    2218:4 12: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 159538 states generated, 24922 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 16.
---*)
