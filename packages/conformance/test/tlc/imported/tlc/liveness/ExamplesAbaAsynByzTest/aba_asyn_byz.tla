(*---
description: Ported from TLC's ExamplesAbaAsynByzTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesAbaAsynByzTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  CONSTANTS
    N = 4
    T = 1
    F = 1
  INVARIANTS TypeOK
  PROPERTIES Unforg_Ltl Corr_Ltl Agreement_Ltl

  PROPERTY AllAccept
  SPECIFICATION Spec
  CONSTRAINT StateConstraint
  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
---*)
------------------------------ MODULE aba_asyn_byz ------------------------------

(* An encoding of the asynchronous Byzantine consensus protocol in Fig.3 [1]: 

   [1] Bracha, Gabriel, and Sam Toueg. "Asynchronous consensus and broadcast protocols." 
   Journal of the ACM (JACM) 32.4 (1985): 824-840.
    
   Thanh Hai Tran, Igor Konnov, Josef Widder, 2016
 
   This file is a subject to the license that is bundled together with this package and can 
   be found in the file LICENSE.
 *)

EXTENDS Naturals (*, FiniteSets *), TLC, TLCExt

CONSTANTS N, T, F

VARIABLES nSntE,    (* the number of ECHO, READY messages which are sent      *)
          nSntR,    
          nRcvdE,   (* the number of ECHO, READY messages which are received  *)
          nRcvdR,  
          nByz,     (* the number of Byzantine processes                      *)
          pc        (* program counters *)
                          

ASSUME NTF == N \in Nat /\ T \in Nat /\ F \in Nat /\ (N > 3 * T) /\ (T >= F) /\ (F >= 0)

Proc == 1 .. N
Location == { "V0", "V1", "EC", "RD", "AC", "BYZ" }
vars == << nSntE, nSntR, nRcvdE, nRcvdR, nByz, pc >>
guardE == (N + T + 2) \div 2
guardR1 == T + 1
guardR2 == 2 * T + 1

(* Some processes propose 0 and others propose 1.*)
Init ==  
  /\ nSntE = 0                      (* Neither ECHO nor READY messages are sent.      *)
  /\ nSntR = 0    
  /\ nRcvdE = [ i \in Proc |-> 0 ]  (* Neither ECHO nor READY messages are received.  *)
  /\ nRcvdR = [ i \in Proc |-> 0 ]
  /\ nByz = 0                       (* No processes are faulty.                       *)
  /\ pc \in [ Proc -> { "V0", "V1" } ]
  
(* All processes propose 0. *)  
Init0 ==  
  /\ nSntE = 0
  /\ nSntR = 0    
  /\ nRcvdE = [ i \in Proc |-> 0 ]
  /\ nRcvdR = [ i \in Proc |-> 0 ]
  /\ nByz = 0
  /\ pc \in [ i \in Proc |-> "V0" ]  
  
(* All processes propose 1. *)  
Init1 ==  
  /\ nSntE = 0
  /\ nSntR = 0    
  /\ nRcvdE = [ i \in Proc |-> 0 ]
  /\ nRcvdR = [ i \in Proc |-> 0 ]
  /\ nByz = 0
  /\ pc \in [ i \in Proc |-> "V1" ]  
  
(* If there are less than F Byzantine processes, process i becomes faulty. *)
(* We requite i to be in an initial state (V0 or V1) to not break the      *)
(* message counting abstraction.                                           *)
BecomeByzantine(i) ==
  /\ nByz < F
  /\ \/ pc[i] = "V1"
     \/ pc[i] = "V0"
  /\ nByz' = nByz + 1  
  /\ pc' = [ pc EXCEPT ![i] = "BYZ" ]  
  /\ UNCHANGED << nSntE, nSntR, nRcvdE, nRcvdR >>

(* Process i receives a new message. If includeByz is TRUE, then messages from both   *)
(* correct and Byzantine processes are considered. Otherwise, only messages from      *)
(* correct processes are considered.                                                  *)
Receive(i, includeByz) ==
  \/ /\ nRcvdE[i] < nSntE + (IF includeByz THEN nByz ELSE 0)
     /\ nRcvdE' = [ nRcvdE EXCEPT ![i] = nRcvdE[i] + 1 ]
     /\ UNCHANGED << nSntE, nSntR, nRcvdR, nByz, pc >>     
  \/ /\ nRcvdR[i] < nSntR + (IF includeByz THEN nByz ELSE 0)
     /\ nRcvdR' = [ nRcvdR EXCEPT ![i] = nRcvdR[i] + 1 ]
     /\ UNCHANGED << nSntE, nSntR, nRcvdE, nByz, pc >>      
  \/ /\ UNCHANGED vars 

(* Process i will send an ECHO message if it proposed 1 and did not send an ECHO message. 
   If process i proposed 0, did not send an ECHO message but has received greater than 
   (N + F) / 2 ECHO messages or (F + 1) READY messages, it will also send an ECHO messages. 
 *)
SendEcho(i) ==
  /\ \/ pc[i] = "V1"
     \/ /\ pc[i] = "V0"
        /\ \/ nRcvdE[i] >= guardE
           \/ nRcvdR[i] >= guardR1
  /\ pc' = [ pc EXCEPT ![i] = "EC" ]
  /\ nSntE' = nSntE + 1
  /\ UNCHANGED << nSntR, nRcvdE, nRcvdR, nByz >>
  
(* If process i sent an ECHO message and has received enough ECHO or READY messages,
   it will send a READY messages.
 *)  
SendReady(i) ==
  /\ pc[i] = "EC" 
  /\ \/ nRcvdE[i] >= guardE
     \/ nRcvdR[i] >= guardR1
  /\ pc' = [ pc EXCEPT ![i] = "RD" ]
  /\ nSntR' = nSntR + 1
  /\ UNCHANGED << nSntE, nRcvdE, nRcvdR, nByz >>
     
(* If process has received READY messages from a majority of processes, it will accept. *)     
Decide(i) ==
  /\ pc[i] = "RD"     
  /\ nRcvdR[i] >= guardR2
  /\ pc' = [ pc EXCEPT ![i] = "AC" ]
  /\ UNCHANGED << nSntE, nSntE, nSntR, nRcvdE, nRcvdR, nByz >>

Next == 
  /\ \E self \in Proc : 
          \/ BecomeByzantine(self)
          \/ Receive(self, TRUE) 
          \/ SendEcho(self) 
          \/ SendReady(self)
          \/ Decide(self)    
          \/ UNCHANGED vars                

(* Add weak fairness condition since we want to check liveness properties.  *)
Spec == Init /\ [][Next]_vars 
             /\ WF_vars(\E self \in Proc : \/ Receive(self, FALSE)
                                           \/ SendEcho(self)
                                           \/ SendReady(self)
                                           \/ Decide(self))
                                           
Spec0 == Init0 /\ [][Next]_vars 
               /\ WF_vars(\E self \in Proc : \/ Receive(self, FALSE)
                                             \/ SendEcho(self)
                                             \/ SendReady(self)
                                             \/ Decide(self))                                           

TypeOK == 
  /\ pc \in [ Proc -> Location ]          
  /\ nSntE \in 0..N
  /\ nSntR \in 0..N
  /\ nByz \in 0..F
  /\ nRcvdE \in [ Proc -> 0..(nSntE + nByz) ]
  /\ nRcvdR \in [ Proc -> 0..(nSntR + nByz) ]
  
  
Unforg_Ltl ==
  (\A i \in Proc : pc[i] = "V0") => []( \A i \in Proc : pc[i] # "AC" )
  

Corr_Ltl == 
   (\A i \in Proc : pc[i] = "V1") => <>( \E i \in Proc : pc[i] = "AC" )
   
Agreement_Ltl ==
  []((\E i \in Proc : pc[i] = "AC") => <>(\A i \in Proc : pc[i] = "AC" \/ pc[i] = "BYZ" ))

StateConstraint ==
    TLCGet("level") < 7

AllAccept == \A self \in Proc : []<><<BecomeByzantine(self)>>_vars

PostCondition ==
   CounterExample = 
   [ action |->
      { << << 1,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<0, 0, 0, 0>>,
                nByz |-> 0,
                pc |-> <<"V0", "V0", "V0", "V0">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 2,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<0, 0, 0, 0>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >>,
        << << 2,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<0, 0, 0, 0>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 3,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<0, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >>,
        << << 3,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<0, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 4,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<1, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >>,
        << << 4,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 0>>,
                nRcvdR |-> <<1, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 5,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 1>>,
                nRcvdR |-> <<1, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >>,
        << << 5,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 1>>,
                nRcvdR |-> <<1, 0, 0, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 6,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 1>>,
                nRcvdR |-> <<1, 0, 1, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >>,
        << << 6,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 1>>,
                nRcvdR |-> <<1, 0, 1, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
           [ name |-> "Next",
             location |->
                 [ beginLine |-> 117,
                   beginColumn |-> 3,
                   endLine |-> 123,
                   endColumn |-> 27,
                   module |-> "aba_asyn_byz" ] ],
           << 6,
              [ nSntE |-> 0,
                nSntR |-> 0,
                nRcvdE |-> <<0, 0, 0, 1>>,
                nRcvdR |-> <<1, 0, 1, 1>>,
                nByz |-> 1,
                pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> >> },
  state |->
      { << 1,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 0>>,
             nRcvdR |-> <<0, 0, 0, 0>>,
             nByz |-> 0,
             pc |-> <<"V0", "V0", "V0", "V0">> ] >>,
        << 2,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 0>>,
             nRcvdR |-> <<0, 0, 0, 0>>,
             nByz |-> 1,
             pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
        << 3,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 0>>,
             nRcvdR |-> <<0, 0, 0, 1>>,
             nByz |-> 1,
             pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
        << 4,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 0>>,
             nRcvdR |-> <<1, 0, 0, 1>>,
             nByz |-> 1,
             pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
        << 5,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 1>>,
             nRcvdR |-> <<1, 0, 0, 1>>,
             nByz |-> 1,
             pc |-> <<"V0", "V0", "V0", "BYZ">> ] >>,
        << 6,
           [ nSntE |-> 0,
             nSntR |-> 0,
             nRcvdE |-> <<0, 0, 0, 1>>,
             nRcvdR |-> <<1, 0, 1, 1>>,
             nByz |-> 1,
             pc |-> <<"V0", "V0", "V0", "BYZ">> ] >> } ]
   
=============================================================================
\* Modification History
\* Last modified Fri Jul 06 15:04:01 CEST 2018 by tthai

(*--- recorded
all:
  exit: 13
  transcript: |-
    | line 189, col 17 to line 189, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 190, col 17 to line 190, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 191, col 17 to line 191, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 192, col 17 to line 192, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 193, col 17 to line 193, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 194, col 17 to line 194, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 203, col 17 to line 203, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 204, col 17 to line 204, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 205, col 17 to line 205, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 206, col 17 to line 206, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 207, col 17 to line 207, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 208, col 17 to line 208, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 210, col 17 to line 210, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 211, col 17 to line 211, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 212, col 17 to line 212, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 213, col 17 to line 213, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 214, col 17 to line 214, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 215, col 17 to line 215, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 224, col 17 to line 224, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 225, col 17 to line 225, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 226, col 17 to line 226, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 227, col 17 to line 227, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 228, col 17 to line 228, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 229, col 17 to line 229, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 231, col 17 to line 231, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 232, col 17 to line 232, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 233, col 17 to line 233, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 234, col 17 to line 234, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 235, col 17 to line 235, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 236, col 17 to line 236, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 245, col 17 to line 245, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 246, col 17 to line 246, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 247, col 17 to line 247, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 248, col 17 to line 248, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 249, col 17 to line 249, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 250, col 17 to line 250, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 252, col 17 to line 252, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 253, col 17 to line 253, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 254, col 17 to line 254, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 255, col 17 to line 255, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 256, col 17 to line 256, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 257, col 17 to line 257, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 266, col 17 to line 266, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 267, col 17 to line 267, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 268, col 17 to line 268, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 269, col 17 to line 269, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 270, col 17 to line 270, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 271, col 17 to line 271, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 273, col 17 to line 273, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 274, col 17 to line 274, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 275, col 17 to line 275, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 276, col 17 to line 276, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 277, col 17 to line 277, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 278, col 17 to line 278, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 287, col 17 to line 287, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 288, col 17 to line 288, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 289, col 17 to line 289, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 290, col 17 to line 290, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 291, col 17 to line 291, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 292, col 17 to line 292, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 294, col 17 to line 294, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 295, col 17 to line 295, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 296, col 17 to line 296, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 297, col 17 to line 297, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 298, col 17 to line 298, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 299, col 17 to line 299, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 308, col 17 to line 308, col 21 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 309, col 17 to line 309, col 21 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 310, col 17 to line 310, col 22 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 311, col 17 to line 311, col 22 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 312, col 17 to line 312, col 20 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 313, col 17 to line 313, col 18 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 316, col 14 to line 316, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 317, col 14 to line 317, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 318, col 14 to line 318, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 319, col 14 to line 319, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 320, col 14 to line 320, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 321, col 14 to line 321, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 323, col 14 to line 323, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 324, col 14 to line 324, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 325, col 14 to line 325, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 326, col 14 to line 326, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 327, col 14 to line 327, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 328, col 14 to line 328, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 330, col 14 to line 330, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 331, col 14 to line 331, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 332, col 14 to line 332, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 333, col 14 to line 333, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 334, col 14 to line 334, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 335, col 14 to line 335, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 337, col 14 to line 337, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 338, col 14 to line 338, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 339, col 14 to line 339, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 340, col 14 to line 340, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 341, col 14 to line 341, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 342, col 14 to line 342, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 344, col 14 to line 344, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 345, col 14 to line 345, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 346, col 14 to line 346, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 347, col 14 to line 347, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 348, col 14 to line 348, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 349, col 14 to line 349, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    | line 351, col 14 to line 351, col 18 of module aba_asyn_byz
    | The field name "nSntE" in the record constructor is identical to the existing definition or declaration
    | named nSntE, located at line 41, col 11 to line 41, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntE |-> ...] = {"nSntE"} holds true.
    | line 352, col 14 to line 352, col 18 of module aba_asyn_byz
    | The field name "nSntR" in the record constructor is identical to the existing definition or declaration
    | named nSntR, located at line 42, col 11 to line 42, col 15 of module aba_asyn_byz.
    | The field in the record will not take the value of the nSntR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nSntR |-> ...] = {"nSntR"} holds true.
    | line 353, col 14 to line 353, col 19 of module aba_asyn_byz
    | The field name "nRcvdE" in the record constructor is identical to the existing definition or declaration
    | named nRcvdE, located at line 43, col 11 to line 43, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdE |-> ...] = {"nRcvdE"} holds true.
    | line 354, col 14 to line 354, col 19 of module aba_asyn_byz
    | The field name "nRcvdR" in the record constructor is identical to the existing definition or declaration
    | named nRcvdR, located at line 44, col 11 to line 44, col 16 of module aba_asyn_byz.
    | The field in the record will not take the value of the nRcvdR definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nRcvdR |-> ...] = {"nRcvdR"} holds true.
    | line 355, col 14 to line 355, col 17 of module aba_asyn_byz
    | The field name "nByz" in the record constructor is identical to the existing definition or declaration
    | named nByz, located at line 45, col 11 to line 45, col 14 of module aba_asyn_byz.
    | The field in the record will not take the value of the nByz definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [nByz |-> ...] = {"nByz"} holds true.
    | line 356, col 14 to line 356, col 15 of module aba_asyn_byz
    | The field name "pc" in the record constructor is identical to the existing definition or declaration
    | named pc, located at line 46, col 11 to line 46, col 12 of module aba_asyn_byz.
    | The field in the record will not take the value of the pc definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [pc |-> ...] = {"pc"} holds true.
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 16 distinct states generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 54532 total distinct states at (<date>)
    2116:1 Temporal property AllAccept was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ pc = <<"V0", "V0", "V0", "V0">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 0>>
    /\ nRcvdR = <<0, 0, 0, 0>>
    /\ nByz = 0
    2217:4 2: <Next line 140, col 3 to line 146, col 27 of module aba_asyn_byz>
    /\ pc = <<"V0", "V0", "V0", "BYZ">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 0>>
    /\ nRcvdR = <<0, 0, 0, 0>>
    /\ nByz = 1
    2217:4 3: <Next line 140, col 3 to line 146, col 27 of module aba_asyn_byz>
    /\ pc = <<"V0", "V0", "V0", "BYZ">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 0>>
    /\ nRcvdR = <<0, 0, 0, 1>>
    /\ nByz = 1
    2217:4 4: <Next line 140, col 3 to line 146, col 27 of module aba_asyn_byz>
    /\ pc = <<"V0", "V0", "V0", "BYZ">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 0>>
    /\ nRcvdR = <<1, 0, 0, 1>>
    /\ nByz = 1
    2217:4 5: <Next line 140, col 3 to line 146, col 27 of module aba_asyn_byz>
    /\ pc = <<"V0", "V0", "V0", "BYZ">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 1>>
    /\ nRcvdR = <<1, 0, 0, 1>>
    /\ nByz = 1
    2217:4 6: <Next line 140, col 3 to line 146, col 27 of module aba_asyn_byz>
    /\ pc = <<"V0", "V0", "V0", "BYZ">>
    /\ nSntE = 0
    /\ nSntR = 0
    /\ nRcvdE = <<0, 0, 0, 1>>
    /\ nRcvdR = <<1, 0, 1, 1>>
    /\ nByz = 1
    2218:4 7: Stuttering
    2404:1 Postcondition PostCondition at line 186, col 4 to line 356, col 56 of module aba_asyn_byz is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 205172 states generated, 13633 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 6.
---*)
