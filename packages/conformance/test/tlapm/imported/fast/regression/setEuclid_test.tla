(*---
description: tlapm's own test fast/regression/setEuclid_test.tla.
ref: test/fast/regression/setEuclid_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
----------------------------- MODULE setEuclid_test -----------------------------
(***************************************************************************)
(* The ordinary Euclid algorithm computes the GCD (greatest common         *)
(* divisor) of two numbers M and N by using two variables x and y,         *)
(* initialized with x = M and y = N, and repeatedly subtracting the        *)
(* smaller of x and y from the larger until x and y are equal.  At that    *)
(* point, x and y both equal the GCD of M and N.                           *)
(*                                                                         *)
(* There is an obvious generalization that computes the GCD of a set of    *)
(* numbers.  Asked to write that algorithm, most programmers and computer  *)
(* scientists would use an array variable whose elements are initially     *)
(* equal to the given numbers.  The algorithm would subtract smaller       *)
(* elements from larger elements until all elements of the array are       *)
(* equal, at which point they all equal the GCD.  The code would probably  *)
(* use two nested loops looking for pairs of unequal array elements.       *)
(*                                                                         *)
(* However, I wrote that the generalization computes the GCD of a set of   *)
(* numbers, not an array of numbers.  The algorithm for computing the GCD  *)
(* of a set is much simpler and more elegant.  This module presents a      *)
(* PlusCal version of this algorithm.                                      *)
(***************************************************************************)

(***************************************************************************)
(* The following statement imports definitions from three standard         *)
(* modules.  The Integers module defines the usual arithmetic operations   *)
(* on integers, the set Nat of natural numbers, and the operator `..'      *)
(* where i..j is the set of integers from i through j.                     *)
(*                                                                         *)
(* The FiniteSets module defines the Cardinality operator and the operator *)
(* IsFiniteSet, where IsFiniteSet(S) is true iff S is a finite set.        *)
(*                                                                         *)
(* The TLAPS module defines some operators that are used when writing      *)
(* proofs to be checked by the TLAPS proof system.                         *)
(***************************************************************************)
EXTENDS Integers, FiniteSets, TLAPS

(***************************************************************************)
(* We now declare Input, which is the set of numbers whose GCD we want to  *)
(* find.  We also declare the assumption that it is a finite, nonempty set *)
(* of positive integers--an assumption we name InputAssump for future      *)
(* reference.                                                              *)
(***************************************************************************)
CONSTANT Input

ASSUME InputAssump == /\ Input \subseteq Nat \ {0}
                      /\ Input # {}
                      /\ IsFiniteSet(Input)

(***************************************************************************
Here is the PlusCal algorithm, which as you can see appears inside a comment.
The `variables' statement declares S to be a variable with initial value
Input, and declares gcd to be a variable that will be given some
default initial value.  The algorithm sets gcd to be the GCD of Input when
it terminates.

--algorithm EuclidForSets {
    variables S = Input, gcd ;
    { lbl: while (Cardinality(S) > 1)
             { with (i \in S, j \in {s \in S : s > i})
                 {  S := (S \ {j}) \cup {j-i}
                 }
             } ;
           gcd := CHOOSE t \in S : TRUE
    }
}

In PlusCal, an execution step (an atomic action) consists of execution
from one lable to the next.  There is an implicit label Done at the end
of the algorithm.  Thus, each iteration of the while loop is one step,
and there is one final step that sets gcd.

The translator put TLA+ translation of this algorithm below, between the
BEGIN and END comments.  The translation adds a variable pc whose value
indicates the where in the algorithm the locus of control is.

The important parts of the specification are the initial predicate Init,
which specifies the initial state, and the next-state relation Next,
which describes how the state can change--unprimed variables referring
to their value in the old state and primed variables referring to their
value in the new state.  The second disjunction of Next allows steps that
leave the state unchanged when the algorithm has reached its terminating
state.  You can ignore that disjunction and those steps, which don't
affect invariance properties.
****************************************************************************)
\* BEGIN TRANSLATION
CONSTANT defaultInitValue
VARIABLES S, gcd, pc

vars == << S, gcd, pc >>

Init == (* Global variables *)
        /\ S = Input
        /\ gcd = defaultInitValue
        /\ pc = "lbl"

lbl == /\ pc = "lbl"
       /\ IF Cardinality(S) > 1
             THEN /\ \E i \in S:
                       \E j \in {s \in S : s > i}:
                         S' = ((S \ {j}) \cup {j-i})
                  /\ pc' = "lbl"
                  /\ gcd' = gcd
             ELSE /\ gcd' = (CHOOSE t \in S : TRUE)
                  /\ pc' = "Done"
                  /\ S' = S

Next == lbl
           \/ (* Disjunct to prevent deadlock on termination *)
              (pc = "Done" /\ UNCHANGED vars)

Spec == Init /\ [][Next]_vars

Termination == <>(pc = "Done")

\* END TRANSLATION
-----------------------------------------------------------------------------
(***************************************************************************)
(* To assert and check the correctness of the algorithm, we must define    *)
(* the GCD of a set.  First, we define Max(T) to be the maximum of a       *)
(* finite set T of numbers.                                                *)
(***************************************************************************)
Max(T) == CHOOSE x \in T : \A y \in T : x >= y

(***************************************************************************)
(* Next, we define m | n to be true for positive integers m and n iff m    *)
(* divides n.  A simpler definition is                                     *)
(*                                                                         *)
(*    m | n == n % m = 0                                                   *)
(*                                                                         *)
(* but I prefer to define it without using the modulus operator % (defined *)
(* in the Integers module).                                                *)
(***************************************************************************)
m | n == \E q \in 1..n : n = q * m

(***************************************************************************)
(* We can now define GCD(T) to equal the GCD of a non-empty set of         *)
(* non-negative integers.  The obvious definition is                       *)
(*                                                                         *)
(*    GCD(T) == Max({d \in Nat \ {0} : \A t \in T : d | t})                *)
(*                                                                         *)
(* However, the TLC model checker can't evaluate this definition because   *)
(* it would have to try all elements d in Nat \ {0} in order to construct  *)
(* the set {d \in ...  }.  So, we use the following instead.               *)
(***************************************************************************)
GCD(T) == Max({d \in 1..Max(T) : \A t \in T : d | t})

(***************************************************************************)
(* We could check the correctness of the algorithm by adding the statement *)
(*                                                                         *)
(*    assert gcd = GCD(Input)                                              *)
(*                                                                         *)
(* after the assignment to gcd in the PlusCal code.  When running the      *)
(* model checker on a model that assigns a particular set of numbers to    *)
(* Inner, TLC will report an error if that assertion is not true when the  *)
(* `assert' statement is executed.                                         *)
(*                                                                         *)
(* Another way to check correctness is to observe from the translation     *)
(* that an execution of the algorithm has terminated iff pc = "Done",      *)
(* where pc is a variable, added by the translation, whose value indicates *)
(* where the locus of control is.  We can therefore check correctness by   *)
(* constructing a model that checks the invariance of the following        *)
(* formula                                                                 *)
(***************************************************************************)
CorrectTermination == (pc = "Done") => (gcd = GCD(Input))
-----------------------------------------------------------------------------
(***************************************************************************)
(* The Invariance Proof                                                    *)
(*                                                                         *)
(* We now prove that CorrectTermination is an invariant, meaning that it   *)
(* is true of all states of every behavior.  The standard way to prove     *)
(* this is to find an invariant Inv that satisfies the following three     *)
(* properties:                                                             *)
(*                                                                         *)
(*   1. Inv is true in any initial state.                                  *)
(*                                                                         *)
(*   2. Executing one step of the algorithm in any state satisfying Inv    *)
(*      yields a state satisfying Inv.                                     *)
(*                                                                         *)
(*   3. Any state satisfying Inv satisfies CorrectTermination              *)
(*                                                                         *)
(* By induction, 1 and 2 implies that Inv is an invariant (true in any     *)
(* state of any behavior).  Property 3 then implies that                   *)
(* CorrectTermination is an invariant.  An invariant satisfying 1 and 2 is *)
(* called an inductive invariant.                                          *)
(*                                                                         *)
(* Properties 1-3 are expressed in TLA+ by the following formulas:         *)
(*                                                                         *)
(*   1. Init => Inv                                                        *)
(*                                                                         *)
(*   2. Inv /\ Next => Inv'                                                *)
(*                                                                         *)
(*   3. Inv => CorrectTermination                                          *)
(*                                                                         *)
(* In property 2, the formula Inv' is obtained from Inv by replacing each  *)
(* variable v in Inv by v' (after completely expanding the definition of   *)
(* Inv).  Thus Inv' asserts that Inv is true in the next state.            *)
(*                                                                         *)
(* In an untyped logic like TLA+, the invariant Inv almost always asserts  *)
(* type correctness--meaning that the value of each variable is an element *)
(* of the proper set.  This is expressed by the following formula TypeOK.  *)
(* It asserts that S is a nonempty finite subset of positive integers and  *)
(* that pc equals either "lbl" or "Done".  Since the value of gcd is set   *)
(* only when the algorithm terminates, TypeOK asserts only that gcd is a   *)
(* positive integer when pc equals "Done".                                 *)
(***************************************************************************)
TypeOK == /\ /\ S \subseteq Nat \ {0}
             /\ S # {}
             /\ IsFiniteSet(S)
          /\ (pc = "Done") => (gcd \in Nat \ {0})
          /\ pc \in {"lbl", "Done"}

(***************************************************************************)
(* Here is the complete definition of the inductive invariant Inv.  It's   *)
(* most interesting part is the second conjunct.                           *)
(***************************************************************************)
Inv == /\ TypeOK
       /\ GCD(S) = GCD(Input)
       /\ CorrectTermination

(***************************************************************************)
(* Let's now prove properties 1-3.  We start with the easy ones,           *)
(* properties 1 and 3.  You should first convince yourself that they are   *)
(* obviously true.  (Writing out the proofs is a good exercise.)           *)
(***************************************************************************)
THEOREM Init => Inv
BY InputAssump DEF Init, Inv, TypeOK, CorrectTermination

THEOREM Inv => CorrectTermination
BY DEF Inv

(***************************************************************************)
(* We now come to the proof of property 2, which is always the hard part   *)
(* of an invariance.  I recommend that you now write an informal proof of  *)
(* this property.  You will probably prefer to reason about the PlusCal    *)
(* code rather than its the TLA+ translation.  You should observe that     *)
(* your proof requires the following two properties of the GCD.  Property  *)
(* GCD2 is obvious, but property GCD1 isn't.  Proving it is a nice little  *)
(* exercise.  However, this spec is meant to be an example of verifying an *)
(* algorithm, not of proving properties of numbers.  So, the proofs are    *)
(* omitted.                                                                *)
(***************************************************************************)
THEOREM GCD1 == \A T \in SUBSET (Nat \ {0}) :
                   IsFiniteSet(T) =>
                      \A x, y \in T : (x > y) => GCD(T) = GCD((T \ {x}) \cup {x-y})
PROOF OMITTED

THEOREM GCD2 == \A x \in (Nat \ {0}) : GCD({x}) = x
PROOF OMITTED

(***************************************************************************)
(* If you were to write a very rigorous proof of property 2, you would     *)
(* find that your proof uses the following property of the GCD and the two *)
(* succeeding properties of Cardinality and finite sets.  Knowledge of     *)
(* these properties as well as of GCD1 and GCD2 is not built into the      *)
(* TLAPS proof system.  If we want the prover to use these properties, we  *)
(* must tell it to.                                                        *)
(*                                                                         *)
(* Because we don't want to prove such simple mathematical facts, we       *)
(* assume them without proof.  However, assuming theorems without proof is *)
(* dangerous.  It's easy to make a mistake when writing even such simple   *)
(* properties as these.  In fact, I made several mistakes when I first     *)
(* wrote them down.  And from a false assumption, one can prove anything.  *)
(*                                                                         *)
(* To catch errors, I checked all these theorems with the TLC model        *)
(* checker.  For GCD1--GCD3, I created a model in which Nat was replaced   *)
(* by a finite set of natural numbers.  I checked the other two assertions *)
(* for finite sets of values of T and x.  (Using TLA+'s ability to name    *)
(* subexpressions of an expression, including the right-hand side of a     *)
(* defintion, I could do this without having to rewrite any formulas.)     *)
(***************************************************************************)
THEOREM GCD3 == \A T \in SUBSET (Nat \ {0}) :
                       IsFiniteSet(T) /\ (T # {}) => (GCD(T) \in Nat \ {0})
PROOF OMITTED

THEOREM CardThm == \A T : IsFiniteSet(T) =>
                             /\ Cardinality(T) \in Nat
                             /\ (Cardinality(T) = 0) <=> (T = {})
                             /\ (Cardinality(T) = 1) <=> (\E x \in T : T = {x})
PROOF OMITTED

THEOREM FiniteSetThm == \A T, x : IsFiniteSet(T) => /\ IsFiniteSet(T \cup {x})
                                                    /\ IsFiniteSet(T \ {x})
PROOF OMITTED

(***************************************************************************)
(* Below is the statement and TLAPS checked proof of property 2.  To write *)
(* the proof, I first tried proving the theorem with the following leaf    *)
(* proof.                                                                  *)
(*                                                                         *)
(*    BY InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3          *)
(*    DEF Inv, TypeOK, CorrectTermination, lbl, Next, vars                 *)
(*                                                                         *)
(* This tells TLAPS to use all the facts in the BY clause and expand all   *)
(* the definitions in the DEF clause.  (The "Fact" Z3 instructs TLAPS to   *)
(* use the Z3 backend prover, which I now use as my default.)              *)
(*                                                                         *)
(* When that proof failed, I kept using the Toolbox's Decompose Proof      *)
(* command to split the proof into simpler substeps.  When doing that, it  *)
(* uses that same leaf proof for the substeps.  I then decomposed the      *)
(* substeps that it still couldn't prove.  (I removed some obviously       *)
(* unnecessary facts and definitions from the leaf proofs of substeps to   *)
(* make things easier for the prover.)                                     *)
(*                                                                         *)
(* Finally, when I reached a step that could not be automatically          *)
(* decomposed, I had to manually split the proof into steps simple enough  *)
(* for TLAPS to prove them.  I have marked all the steps that I had to     *)
(* write with the comment "|" to the left.                                 *)
(***************************************************************************)
THEOREM Inv /\ Next => Inv'
  <1> SUFFICES ASSUME Inv,
                      Next
               PROVE  Inv'
    OBVIOUS

  <1>1. ASSUME lbl
        PROVE  Inv'
    <2>1. TypeOK'
      <3>1. (/\ S \subseteq Nat \ {0}
             /\ S # {}
             /\ IsFiniteSet(S))'
        <4>1. (S \subseteq Nat \ {0})'
          BY \A i, j \in S : j > i => j - i \in Nat \ {0},
             <1>1 DEF Inv, TypeOK, lbl
        <4>2. (S # {})'
          BY <1>1, InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3
          DEF Inv, TypeOK, CorrectTermination, lbl
        <4>3. IsFiniteSet(S)'
(*|*)     <5>1. CASE Cardinality(S) > 1
(*|*)         BY <5>1, <1>1, FiniteSetThm, Auto DEF Inv, TypeOK, lbl
(*|*)     <5>2. CASE ~(Cardinality(S) > 1)
(*|*)       BY <5>2, <1>1, FiniteSetThm, Z3 DEF Inv, TypeOK, lbl
(*|*)     <5>3. QED
(*|*)       BY <5>1, <5>2
        <4>4. QED
          BY <4>1, <4>2, <4>3
      <3>2. ((pc = "Done") => gcd \in Nat \ {0})'
        BY (CHOOSE t \in S : TRUE) \in Nat \{0},
           <1>1, InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3
        DEF Inv, TypeOK, CorrectTermination, lbl
      <3>3. (pc \in {"lbl", "Done"})'
        BY <1>1, InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3
        DEF Inv, TypeOK, CorrectTermination, lbl
      <3>4. QED
        BY <3>1, <3>2, <3>3 DEF TypeOK
    <2>2. (GCD(S) = GCD(Input))'
(*|*) <3>1. CASE Cardinality(S) > 1
(*|*)   <4>1. PICK i \in S : \E j \in {s \in S : s  >  i} :
(*|*)                           S'  =  (S  \  {j})  \union  {j  -  i}
(*|*)     BY <1>1, <3>1 DEF lbl
(*|*)   <4>2. PICK j \in {s \in S : s  >  i} :
(*|*)                           S'  =  (S  \  {j})  \union  {j  -  i}
(*|*)     BY <4>1
(*|*)   <4>3. j \in S /\ j > i
(*|*)     BY <4>2
(*|*)   <4>4. QED
(*|*)     BY <4>2, <4>3, GCD1 DEF Inv, TypeOK
(*|*) <3>2. CASE ~(Cardinality(S) > 1)
(*|*)   BY <3>2, <1>1, InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3
(*|*)   DEF Inv, TypeOK, CorrectTermination, lbl
(*|*) <3>3. QED
(*|*)   BY <3>1, <3>2
    <2>3. CorrectTermination'
      <3>1. Cardinality (S) = 1 => S = {CHOOSE t \in S : TRUE}
        <4> Cardinality (S) = 1 => \E x \in S : S = {x}
          BY CardThm DEF Inv, TypeOK
        <4> QED
          BY Zenon
      <3>2. Cardinality (S) = 1 => GCD (S) = CHOOSE t \in S : TRUE
        BY <3>1, GCD2 DEF Inv, TypeOK
      <3> QED
        BY <1>1, <3>2, InputAssump, GCD1, GCD2, GCD3, CardThm, FiniteSetThm, Z3
        DEF Inv, TypeOK, CorrectTermination, lbl
    <2>4. QED
      BY <2>1, <2>2, <2>3 DEF Inv

  <1>2. ASSUME pc = "Done" /\ UNCHANGED vars
        PROVE  Inv'
    BY <1>2 DEF Inv, TypeOK, CorrectTermination,  vars

  <1>3. QED
    BY <1>1, <1>2 DEF Next
=============================================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 234:1:234:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 234:1:234:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 234:4:234:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 234:4:234:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 237:1:237:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 237:1:237:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 9
    @loc: 389:5:389:7
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 389:5:389:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 10
    @loc: 389:8:389:12
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 389:8:389:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 389:14:389:18
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 389:14:389:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 321:5:321:12
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 321:5:321:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 13
    @loc: 382:7:382:9
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 382:7:382:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 14
    @loc: 382:10:382:14
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 382:10:382:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 382:16:382:20
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 382:16:382:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 382:22:382:26
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 382:22:382:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 352:9:352:11
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 352:9:352:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 18
    @loc: 352:12:352:16
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 352:12:352:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 19
    @loc: 352:18:352:22
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 352:18:352:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 352:24:352:28
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 352:24:352:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 21
    @loc: 343:11:343:13
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 343:11:343:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 22
    @loc: 343:14:343:18
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 343:14:343:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 23
    @loc: 343:20:343:24
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 343:20:343:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 24
    @loc: 343:26:343:30
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 343:26:343:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 25
    @loc: 330:11:330:13
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 330:11:330:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 26
    @loc: 330:14:330:58
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 330:14:330:58
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 27
    @loc: 331:14:331:18
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 331:14:331:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 333:11:333:13
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 333:11:333:13
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 29
    @loc: 333:14:333:18
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 333:14:333:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 30
    @loc: 333:20:333:31
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 333:20:333:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 31
    @loc: 333:33:333:37
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 333:33:333:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 32
    @loc: 333:39:333:43
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 333:39:333:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 33
    @loc: 333:45:333:49
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 333:45:333:49
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 34
    @loc: 333:51:333:58
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 333:51:333:58
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 35
    @loc: 333:60:333:72
    @status: to be proved

    @type: obligation
    @id: 35
    @loc: 333:60:333:72
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 36
    @loc: 333:74:333:76
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 333:74:333:76
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 37
    @loc: 341:13:341:15
    @status: to be proved

    @type: obligation
    @id: 37
    @loc: 341:13:341:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 38
    @loc: 341:16:341:20
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 341:16:341:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 39
    @loc: 341:22:341:26
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 341:22:341:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 40
    @loc: 337:15:337:17
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 337:15:337:17
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 41
    @loc: 337:18:337:22
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 337:18:337:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 42
    @loc: 337:24:337:28
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 337:24:337:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 43
    @loc: 337:30:337:42
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 337:30:337:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 44
    @loc: 337:44:337:48
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 337:44:337:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 45
    @loc: 339:13:339:15
    @status: to be proved

    @type: obligation
    @id: 45
    @loc: 339:13:339:15
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 46
    @loc: 339:16:339:20
    @status: to be proved

    @type: obligation
    @id: 46
    @loc: 339:16:339:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 47
    @loc: 339:22:339:26
    @status: to be proved

    @type: obligation
    @id: 47
    @loc: 339:22:339:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 48
    @loc: 339:28:339:40
    @status: to be proved

    @type: obligation
    @id: 48
    @loc: 339:28:339:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 49
    @loc: 339:42:339:44
    @status: to be proved

    @type: obligation
    @id: 49
    @loc: 339:42:339:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 50
    @loc: 345:9:345:11
    @status: to be proved

    @type: obligation
    @id: 50
    @loc: 345:9:345:11
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 51
    @loc: 345:13:345:48
    @status: to be proved

    @type: obligation
    @id: 51
    @loc: 345:13:345:48
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 52
    @loc: 346:12:346:16
    @status: to be proved

    @type: obligation
    @id: 52
    @loc: 346:12:346:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 53
    @loc: 346:18:346:29
    @status: to be proved

    @type: obligation
    @id: 53
    @loc: 346:18:346:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 54
    @loc: 346:31:346:35
    @status: to be proved

    @type: obligation
    @id: 54
    @loc: 346:31:346:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 55
    @loc: 346:37:346:41
    @status: to be proved

    @type: obligation
    @id: 55
    @loc: 346:37:346:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 56
    @loc: 346:43:346:47
    @status: to be proved

    @type: obligation
    @id: 56
    @loc: 346:43:346:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 57
    @loc: 346:49:346:56
    @status: to be proved

    @type: obligation
    @id: 57
    @loc: 346:49:346:56
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 58
    @loc: 346:58:346:70
    @status: to be proved

    @type: obligation
    @id: 58
    @loc: 346:58:346:70
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 59
    @loc: 346:72:346:74
    @status: to be proved

    @type: obligation
    @id: 59
    @loc: 346:72:346:74
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 60
    @loc: 349:9:349:11
    @status: to be proved

    @type: obligation
    @id: 60
    @loc: 349:9:349:11
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 61
    @loc: 349:12:349:16
    @status: to be proved

    @type: obligation
    @id: 61
    @loc: 349:12:349:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 62
    @loc: 349:18:349:29
    @status: to be proved

    @type: obligation
    @id: 62
    @loc: 349:18:349:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 63
    @loc: 349:31:349:35
    @status: to be proved

    @type: obligation
    @id: 63
    @loc: 349:31:349:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 64
    @loc: 349:37:349:41
    @status: to be proved

    @type: obligation
    @id: 64
    @loc: 349:37:349:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 65
    @loc: 349:43:349:47
    @status: to be proved

    @type: obligation
    @id: 65
    @loc: 349:43:349:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 66
    @loc: 349:49:349:56
    @status: to be proved

    @type: obligation
    @id: 66
    @loc: 349:49:349:56
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 67
    @loc: 349:58:349:70
    @status: to be proved

    @type: obligation
    @id: 67
    @loc: 349:58:349:70
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 68
    @loc: 349:72:349:74
    @status: to be proved

    @type: obligation
    @id: 68
    @loc: 349:72:349:74
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 69
    @loc: 369:9:369:11
    @status: to be proved

    @type: obligation
    @id: 69
    @loc: 369:9:369:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 70
    @loc: 369:12:369:16
    @status: to be proved

    @type: obligation
    @id: 70
    @loc: 369:12:369:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 71
    @loc: 369:18:369:22
    @status: to be proved

    @type: obligation
    @id: 71
    @loc: 369:18:369:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 72
    @loc: 364:11:364:13
    @status: to be proved

    @type: obligation
    @id: 72
    @loc: 364:11:364:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 73
    @loc: 364:14:364:18
    @status: to be proved

    @type: obligation
    @id: 73
    @loc: 364:14:364:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 74
    @loc: 364:20:364:24
    @status: to be proved

    @type: obligation
    @id: 74
    @loc: 364:20:364:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 75
    @loc: 364:26:364:30
    @status: to be proved

    @type: obligation
    @id: 75
    @loc: 364:26:364:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 76
    @loc: 357:11:357:13
    @status: to be proved

    @type: obligation
    @id: 76
    @loc: 357:11:357:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 77
    @loc: 357:14:357:18
    @status: to be proved

    @type: obligation
    @id: 77
    @loc: 357:14:357:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 78
    @loc: 357:20:357:24
    @status: to be proved

    @type: obligation
    @id: 78
    @loc: 357:20:357:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 80
    @loc: 360:11:360:13
    @status: to be proved

    @type: obligation
    @id: 80
    @loc: 360:11:360:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 81
    @loc: 360:14:360:18
    @status: to be proved

    @type: obligation
    @id: 81
    @loc: 360:14:360:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 83
    @loc: 362:11:362:13
    @status: to be proved

    @type: obligation
    @id: 83
    @loc: 362:11:362:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 84
    @loc: 362:14:362:18
    @status: to be proved

    @type: obligation
    @id: 84
    @loc: 362:14:362:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 85
    @loc: 366:9:366:11
    @status: to be proved

    @type: obligation
    @id: 85
    @loc: 366:9:366:11
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 86
    @loc: 366:12:366:16
    @status: to be proved

    @type: obligation
    @id: 86
    @loc: 366:12:366:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 87
    @loc: 366:18:366:22
    @status: to be proved

    @type: obligation
    @id: 87
    @loc: 366:18:366:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 88
    @loc: 366:24:366:35
    @status: to be proved

    @type: obligation
    @id: 88
    @loc: 366:24:366:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 89
    @loc: 366:37:366:41
    @status: to be proved

    @type: obligation
    @id: 89
    @loc: 366:37:366:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 90
    @loc: 366:43:366:47
    @status: to be proved

    @type: obligation
    @id: 90
    @loc: 366:43:366:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 91
    @loc: 366:49:366:53
    @status: to be proved

    @type: obligation
    @id: 91
    @loc: 366:49:366:53
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 92
    @loc: 366:55:366:62
    @status: to be proved

    @type: obligation
    @id: 92
    @loc: 366:55:366:62
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 93
    @loc: 366:64:366:76
    @status: to be proved

    @type: obligation
    @id: 93
    @loc: 366:64:366:76
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 94
    @loc: 366:78:366:80
    @status: to be proved

    @type: obligation
    @id: 94
    @loc: 366:78:366:80
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 95
    @loc: 379:9:379:11
    @status: to be proved

    @type: obligation
    @id: 95
    @loc: 379:9:379:11
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 96
    @loc: 379:12:379:16
    @status: to be proved

    @type: obligation
    @id: 96
    @loc: 379:12:379:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 97
    @loc: 379:18:379:22
    @status: to be proved

    @type: obligation
    @id: 97
    @loc: 379:18:379:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 98
    @loc: 379:24:379:35
    @status: to be proved

    @type: obligation
    @id: 98
    @loc: 379:24:379:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 99
    @loc: 379:37:379:41
    @status: to be proved

    @type: obligation
    @id: 99
    @loc: 379:37:379:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 100
    @loc: 379:43:379:47
    @status: to be proved

    @type: obligation
    @id: 100
    @loc: 379:43:379:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 101
    @loc: 379:49:379:53
    @status: to be proved

    @type: obligation
    @id: 101
    @loc: 379:49:379:53
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 102
    @loc: 379:55:379:62
    @status: to be proved

    @type: obligation
    @id: 102
    @loc: 379:55:379:62
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 103
    @loc: 379:64:379:76
    @status: to be proved

    @type: obligation
    @id: 103
    @loc: 379:64:379:76
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 104
    @loc: 379:78:379:80
    @status: to be proved

    @type: obligation
    @id: 104
    @loc: 379:78:379:80
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 105
    @loc: 375:11:375:13
    @status: to be proved

    @type: obligation
    @id: 105
    @loc: 375:11:375:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 106
    @loc: 375:14:375:19
    @status: to be proved

    @type: obligation
    @id: 106
    @loc: 375:14:375:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 107
    @loc: 373:11:373:13
    @status: to be proved

    @type: obligation
    @id: 107
    @loc: 373:11:373:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 108
    @loc: 373:14:373:21
    @status: to be proved

    @type: obligation
    @id: 108
    @loc: 373:14:373:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 109
    @loc: 377:9:377:11
    @status: to be proved

    @type: obligation
    @id: 109
    @loc: 377:9:377:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 110
    @loc: 377:12:377:16
    @status: to be proved

    @type: obligation
    @id: 110
    @loc: 377:12:377:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 111
    @loc: 377:18:377:22
    @status: to be proved

    @type: obligation
    @id: 111
    @loc: 377:18:377:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 112
    @loc: 386:5:386:7
    @status: to be proved

    @type: obligation
    @id: 112
    @loc: 386:5:386:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 113
    @loc: 386:8:386:12
    @status: to be proved

    @type: obligation
    @id: 113
    @loc: 386:8:386:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 106

    Omitted proof at File "./setEuclid_test.tla", line 253, characters 7-13
    Omitted proof at File "./setEuclid_test.tla", line 256, characters 7-13
    Omitted proof at File "./setEuclid_test.tla", line 281, characters 7-13
    Omitted proof at File "./setEuclid_test.tla", line 287, characters 7-13
    Omitted proof at File "./setEuclid_test.tla", line 291, characters 7-13
    File "./setEuclid_test.tla", line 9, character 1 to line 390, character 77:
    [ERROR]: Proof incomplete in module "setEuclid_test": 0 missing, 5 omitted proof step(s).
    File "./setEuclid_test.tla", line 9, character 1 to line 390, character 77:
    [INFO]: All 106 obligations proved.
---*)
