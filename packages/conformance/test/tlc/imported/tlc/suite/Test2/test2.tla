(*---
description: Ported from TLC's Test2.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test2.java
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
--------------- MODULE test2 -------------

(* test equality of various representations of functions. *)

EXTENDS Naturals, TLC

VARIABLE x
CONSTANT a, b, c
f == [i \in {1,2}, j \in {3,4} |-> i+j]
g == [p \in {1,2} \X {3,4} |-> p[1] + p[2]]
h == [i \in {1,2} |-> [j \in {3,4} |-> i+j]]

m == [i \in {3,4} |-> <<i, 7>>]


Type == x \in {1}
Inv  == 
 /\ TRUE

 /\ IF [i \in {3, 2, 1} |-> i+2] # <<3, 4, 5>>
      THEN Assert(FALSE, "Failed Test 1") 
      ELSE Print("Test 1 OK", TRUE)

 /\ IF [i \in {"a", "b", "c"} |-> 
         CASE i = "a" -> 1 [] i = "b" -> 2 [] i = "c" -> 3]
         # [c |-> 3, a |-> 1, b |-> 2]
      THEN Assert(FALSE, "Failed Test 2")
      ELSE Print("Test 2 OK", TRUE)

 /\ IF [c |-> 3, a |-> 1, b |-> 2] # 
        [[a |-> 1, b |-> 3, c |-> 4] EXCEPT !.b =2 , !.c=3]
      THEN Assert(FALSE, "Failed Test 3") 
      ELSE Print("Test 3 OK", TRUE)

 /\ IF <<3, 4, 5>> # [<<3, 42, 75>> EXCEPT ![3]=5, ![2]=4]
      THEN Assert(FALSE, "Failed Test 4") 
      ELSE Print("Test 4 OK", TRUE)

 /\ IF [i \in {3, 2, 1} |-> i+2] # [ j \in 1..3 |-> j+2]
      THEN Assert(FALSE, "Failed Test 5") 
      ELSE Print("Test 5 OK", TRUE)

 /\ IF [i \in {} |-> i] # <<>>
      THEN Assert(FALSE, "Failed Test 6") 
      ELSE Print("Test 6 OK", TRUE)

 /\ IF {i \in [{1,2} -> {a, b, c}] : i[1] = a} # {<<a, a>>, <<a, b>>, <<a, c>>}
      THEN Assert(FALSE, "Failed Test 7") 
      ELSE Print("Test 7 OK", TRUE)

 /\ IF [{"a", "bc"} -> {1, 2, 3}] # [bc : {1,2,3}, a : {1,2,3}]
      THEN Assert(FALSE, "Failed Test 8") 
      ELSE Print("Test 8 OK", TRUE)

 /\ IF f # g
      THEN Assert(FALSE, "Test 9 Failed")
      ELSE Print("Test 9 OK", TRUE)

 /\ IF f = h
      THEN Assert(FALSE, "Test 10 Failed")
      ELSE Print("Test 10 OK", TRUE)

 /\ IF [m EXCEPT ![4] = <<4, 8>>] # [m EXCEPT ![4][2] = @+1]
       THEN Assert(FALSE, "Test 11 Failed")
       ELSE Print("Test 11 OK", TRUE)

 /\ IF m#[m EXCEPT ![4][2] = 7]
       THEN Assert(FALSE, "Test 12 Failed")
       ELSE Print("Test 12 OK", TRUE)

 /\ IF f # [f EXCEPT ![1,3] = 4]
       THEN Assert(FALSE, "Test 13 Failed")
       ELSE Print("Test 13 OK", TRUE)

Init == x = 1

Next == UNCHANGED x
=========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 46, col 13 to line 46, col 13 of module test2
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 28, col 16 to line 28, col 16 of module test2.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 46, col 22 to line 46, col 22 of module test2
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 28, col 10 to line 28, col 10 of module test2.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 46, col 31 to line 46, col 31 of module test2
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 28, col 13 to line 28, col 13 of module test2.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 50, col 9 to line 50, col 9 of module test2
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 28, col 16 to line 28, col 16 of module test2.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 50, col 18 to line 50, col 18 of module test2
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 28, col 10 to line 28, col 10 of module test2.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 50, col 27 to line 50, col 27 of module test2
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 28, col 13 to line 28, col 13 of module test2.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 51, col 11 to line 51, col 11 of module test2
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 28, col 10 to line 28, col 10 of module test2.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 51, col 20 to line 51, col 20 of module test2
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 28, col 13 to line 28, col 13 of module test2.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 51, col 29 to line 51, col 29 of module test2
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 28, col 16 to line 28, col 16 of module test2.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 71, col 52 to line 71, col 52 of module test2
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 28, col 10 to line 28, col 10 of module test2.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | "Test 1 OK"  TRUE
    | "Test 2 OK"  TRUE
    | "Test 3 OK"  TRUE
    | "Test 4 OK"  TRUE
    | "Test 5 OK"  TRUE
    | "Test 6 OK"  TRUE
    | "Test 7 OK"  TRUE
    | "Test 8 OK"  TRUE
    | "Test 9 OK"  TRUE
    | "Test 10 OK"  TRUE
    | "Test 11 OK"  TRUE
    | "Test 12 OK"  TRUE
    | "Test 13 OK"  TRUE
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
