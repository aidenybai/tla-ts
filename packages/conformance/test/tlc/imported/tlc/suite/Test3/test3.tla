(*---
description: Ported from TLC's Test3.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test3.java
features:
  - tlc-suite
outcome: success
config: |2
    INIT
      Init
    
    NEXT
      Next
    
    INVARIANT Inv

    CONSTANT
      a = a
      b = b
      c = c
---*)
--------------- MODULE test3 -------------

(* Test of function application. *)

EXTENDS Naturals, TLC

VARIABLE x
CONSTANT a, b, c

Type == x \in {1}
Inv  == 
 /\ TRUE

 /\ IF [i \in {3, 2, 1} |-> i+1][3] # 4
      THEN Assert(FALSE, "Test 1")
      ELSE Print("Test 1", TRUE)

 /\ IF <<a, b, c>>[2] # b
      THEN Assert(FALSE, "Test 2")
      ELSE Print("Test 2", TRUE)

 /\ IF [a |-> 1, b |-> 42, c |-> 99]["b"] # 42
      THEN Assert(FALSE, "Test 3" )
      ELSE Print("Test 3" , TRUE) 

 /\ IF [i \in Nat |-> i+1][3] # 4
      THEN Assert(FALSE, "Test 4" )
      ELSE Print("Test 4" , TRUE) 

 /\ IF [[i \in Nat |-> i+1] EXCEPT ![42] = 3, ![42] = 5][42] # 5
      THEN Assert(FALSE, "Test 5" )
      ELSE Print("Test 5" , TRUE) 

 /\ IF [[i \in Nat |-> i+1] EXCEPT ![42] = 3, ![42] = 5][79] # 80
      THEN Assert(FALSE, "Test 6" )
      ELSE Print("Test 6" , TRUE) 

 /\ IF [i \in Nat |-> [j \in Nat |-> 2*i + j]][5][3] # 13
      THEN Assert(FALSE, "Test 7" )
      ELSE Print("Test 7" , TRUE) 

 /\ IF [[i \in Nat |-> [j \in Nat |-> 2*i + j]] EXCEPT ![5] = 11][5] # 11
      THEN Assert(FALSE, "Test 8" )
      ELSE Print("Test 8" , TRUE) 
 /\ IF [[i \in Nat |-> [j \in Nat |-> 2*i + j]] EXCEPT ![5][3] = @+1][5][3] # 14
      THEN Assert(FALSE, "Test 9" )
      ELSE Print("Test 9" , TRUE) 

 /\ IF [[i \in Nat |-> [j \in Nat |-> 2*i + j]] 
            EXCEPT ![5][4] = @+2, ![5][3] = @+1][5][3] # 14
      THEN Assert(FALSE, "Test 10" )
      ELSE Print("Test 10" , TRUE) 

 /\ IF [[i \in Nat |-> [j \in Nat |-> 2*i + j]] 
            EXCEPT ![5][3] = @+1, ![5][4] = @+2][5][3] # 14
      THEN Assert(FALSE, "Test 11" )
      ELSE Print("Test 11" , TRUE) 

 /\ IF [[i \in Nat |-> [j \in Nat |-> 2*i + j]] 
        EXCEPT ![5][3] = @+1, ![5][3] = @+2][5][3] # 16
      THEN Assert(FALSE, "Test 12" )
      ELSE Print("Test 12" , TRUE) 

 /\ IF [i \in Nat, j \in STRING |-> <<i+1, j>>][22, "b"] # <<23, "b">>
      THEN Assert(FALSE, "Test 13" )
      ELSE Print("Test 13" , TRUE) 

 /\ IF [i \in Nat, j \in STRING |-> <<i+1, j>>][<<22, "b">>] # <<23, "b">>
      THEN Assert(FALSE, "Test 14" )
      ELSE Print("Test 14" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
        EXCEPT ![22, "c"] = 15] [22, "b"] # <<23, "b">>
      THEN Assert(FALSE, "Test 15" )
      ELSE Print("Test 15" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
          EXCEPT ![22, "c"] = 15] [22, "c"] # 15
      THEN Assert(FALSE, "Test 16" )
      ELSE Print("Test 16" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
        EXCEPT ![22, "c"] = 15] [<<22, "c">>] # 15
      THEN Assert(FALSE, "Test 17" )
      ELSE Print("Test 17" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
          EXCEPT ![22, "c"] = 15, ![22, "d"] = 33] [22, "c"] # 15
      THEN Assert(FALSE, "Test 18" )
      ELSE Print("Test 18" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
          EXCEPT ![22, "d"] = 33, ![22, "c"] = 15] [22, "c"] # 15
      THEN Assert(FALSE, "Test 19" )
      ELSE Print("Test 19" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
          EXCEPT ![22, "d"] = 33, ![22, "d"] = 15] [22, "d"] # 15
      THEN Assert(FALSE, "Test 20" )
      ELSE Print("Test 20" , TRUE) 

 /\ IF [[i \in Nat, j \in STRING |-> <<i+1, j>>] 
        EXCEPT ![22, "d"] = @[1]] [22, "d"] # 23
      THEN Assert(FALSE, "Test 21" )
      ELSE Print("Test 21" , TRUE) 


 /\ IF [[i \in Nat, j \in Nat |-> <<i+1, j>>] 
         EXCEPT ![22, 3] = @[1]] [22, 3] # 23
      THEN Assert(FALSE, "Test 22" )
      ELSE Print("Test 22" , TRUE) 

 /\ Print("Tests completed", TRUE)


 /\ Print("Tests completed", TRUE)

Init == x = 1

Next == UNCHANGED x
=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 42, col 9 to line 42, col 9 of module test3
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 28, col 10 to line 28, col 10 of module test3.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 42, col 18 to line 42, col 18 of module test3
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 28, col 13 to line 28, col 13 of module test3.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 42, col 28 to line 42, col 28 of module test3
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 28, col 16 to line 28, col 16 of module test3.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | "Test 1"  TRUE
    | "Test 2"  TRUE
    | "Test 3"  TRUE
    | "Test 4"  TRUE
    | "Test 5"  TRUE
    | "Test 6"  TRUE
    | "Test 7"  TRUE
    | "Test 8"  TRUE
    | "Test 9"  TRUE
    | "Test 10"  TRUE
    | "Test 11"  TRUE
    | "Test 12"  TRUE
    | "Test 13"  TRUE
    | "Test 14"  TRUE
    | "Test 15"  TRUE
    | "Test 16"  TRUE
    | "Test 17"  TRUE
    | "Test 18"  TRUE
    | "Test 19"  TRUE
    | "Test 20"  TRUE
    | "Test 21"  TRUE
    | "Test 22"  TRUE
    | "Tests completed"  TRUE
    | "Tests completed"  TRUE
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
