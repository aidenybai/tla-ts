(*---
description: tlapm's own test medium/regression/snapshot/GFX_test.tla.
ref: test/medium/regression/snapshot/GFX_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
includes:
  - GFXSpec.tla
---*)
-------------------------------- MODULE GFX_test ----------------------------
EXTENDS Integers, FiniteSets, TLAPS
  (*************************************************************************)
  (* Module Integers defines the standard operators on integers like + and *)
  (* the sets Int of integers and Nat of natural numbers.  (The TLAPS      *)
  (* prover has built-in knowledge of integers and does not use the        *)
  (* definitions in the module.) Module TLAPS asserts some theorems and    *)
  (* defines some "tactics" for use in proofs.                             *)
  (*************************************************************************)

CONSTANT Proc
ASSUME ProcFinite == IsFiniteSet(Proc)
  (*************************************************************************)
  (* We assume that Proc is a finite set, where the operator IsFiniteSet   *)
  (* is defined in the FiniteSets module.                                  *)
  (*************************************************************************)

NUnion(A) == UNION {A[i] : i \in Nat}
-----------------------------------------------------------------------------
(******
--algorithm GFX{
   variables A1 = [i \in Nat |-> {}], result = [i \in Proc |-> {}];
   process (Pr \in Proc)
     variables known = {self}, notKnown = {} ;
     { a: known := known \cup NUnion(A1) ;
          notKnown := {i \in 0..(Cardinality(known)) : known # A1[i]} ;
          if (notKnown # {})
            { b: with (i \in notKnown) { A1[i] := known } ;
                 goto a
            }
          else {result[self] := known}
     }
}

*****)
\* BEGIN TRANSLATION
VARIABLES A1, result, pc, known, notKnown

vars == << A1, result, pc, known, notKnown >>

ProcSet == (Proc)

Init == (* Global variables *)
        /\ A1 = [i \in Nat |-> {}]
        /\ result = [i \in Proc |-> {}]
        (* Process Pr *)
        /\ known = [self \in Proc |-> {self}]
        /\ notKnown = [self \in Proc |-> {}]
        /\ pc = [self \in ProcSet |-> "a"]

a(self) == /\ pc[self] = "a"
           /\ known' = [known EXCEPT ![self] = known[self] \cup NUnion(A1)]
           /\ notKnown' = [notKnown EXCEPT ![self] = {i \in 0..(Cardinality(known'[self])) : known'[self] # A1[i]}]
           /\ IF notKnown'[self] # {}
                 THEN /\ pc' = [pc EXCEPT ![self] = "b"]
                      /\ UNCHANGED result
                 ELSE /\ result' = [result EXCEPT ![self] = known'[self]]
                      /\ pc' = [pc EXCEPT ![self] = "Done"]
           /\ A1' = A1

b(self) == /\ pc[self] = "b"
           /\ \E i \in notKnown[self]:
                A1' = [A1 EXCEPT ![i] = known[self]]
           /\ pc' = [pc EXCEPT ![self] = "a"]
           /\ UNCHANGED << result, known, notKnown >>

Pr(self) == a(self) \/ b(self)

Next == (\E self \in Proc: Pr(self))
           \/ (* Disjunct to prevent deadlock on termination *)
              ((\A self \in ProcSet: pc[self] = "Done") /\ UNCHANGED vars)

Spec == Init /\ [][Next]_vars

Termination == <>(\A self \in ProcSet: pc[self] = "Done")

\* END TRANSLATION
------------------------------------------------------------------------------
snapshot == UNION {A1[i] : i \in Nat}
  (*************************************************************************)
  (* This definition was used in an earlier version of the algorithm, and  *)
  (* since the proof of this version was adapted from the proof of the     *)
  (* earlier one, references to it are still present in the proof.         *)
  (*************************************************************************)

(***************************************************************************)
(* The type-correctness invariant.                                         *)
(***************************************************************************)
TypeOK == /\ A1 \in [Nat -> SUBSET Proc]
          /\ result \in [Proc -> SUBSET Proc]
          /\ pc \in [Proc -> {"a", "b", "Done"}]
          /\ known \in [Proc -> SUBSET Proc]
          /\ notKnown \in [Proc -> SUBSET Nat]
          /\ \A p \in Proc : (pc[p] = "b") => (notKnown[p] # {})

Done(i) == result[i] # {}

(***************************************************************************)
(* The invariance of the following predicate captures the correctnes of    *)
(* the algorithm and is the key to proving that it the algorithm           *)
(* implements/refines its spec.                                            *)
(***************************************************************************)
GFXCorrect == \A i, j \in Proc :
                /\ Done(i) /\ Done(j)
                /\ Cardinality(result[i]) = Cardinality(result[j])
                => (result[i] = result[j])

------------------------------------------------------------------------------
(***************************************************************************)
(* We now define PA1 to be the set of all values that A1 could assume if   *)
(* some subset of processes that are ready to write wrote.                 *)
(***************************************************************************)
NotAProc == CHOOSE n : n \notin Proc
  (*************************************************************************)
  (* An arbitrary value that is not a process.                             *)
  (*************************************************************************)

ReadyToWrite(i, p) == /\ pc[p] = "b"
                      /\ i \in notKnown[p]
  (*************************************************************************)
  (* True iff process p could write known[p] to A1[i] in its next step.    *)
  (*************************************************************************)
WriterAssignment == {f \in [Nat -> Proc \cup {NotAProc}] :
                        \A i \in Nat :
                          (f[i] \in Proc) => /\ ReadyToWrite(i, f[i])
                                             /\ \A j \in Nat \ {i} :
                                                    f[j] # f[i] }
  (*************************************************************************)
  (* The set of functions f that assigns to each Nat i either a unique     *)
  (* process that is ready to write i, or NotAProc.                        *)
  (*************************************************************************)

PV(wa) == [i \in Nat |-> IF wa[i] = NotAProc THEN A1[i]
                                             ELSE known[wa[i]] ]

PA1 == {PV(wa) : wa \in WriterAssignment}
------------------------------------------------------------------------------
(***************************************************************************)
(* We now complete the definition of the inductive invariant Inv.          *)
(*                                                                         *)
(* InvB is an uninteresting part of the invariant that asserts properties  *)
(* which are easily seen to be true by examining the code.                 *)
(***************************************************************************)
InvB == /\ \A i \in Nat : (A1[i] # {}) => (Cardinality(A1[i]) >= i)
        /\ \A p \in Proc :
             /\ (pc[p] = "b") => \A i \in notKnown[p] : i =< Cardinality(known[p])
             /\ p \in known[p]
             /\ (result[p] # {}) <=> (pc[p] = "Done")
             /\ (result[p] # {}) => (result[p] = known[p])

(***************************************************************************)
(* InvC is the interesting part of the inductive invariant that captures   *)
(* the essence of the algorithm.                                           *)
(***************************************************************************)
InvC == \A p \in Proc :
           LET S == result[p]
               k == Cardinality(S)
           IN  k > 0 => \A P \in PA1 :
                           \/ Cardinality(UNION {P[i] : i \in Nat}) > k
                           \/ S \subseteq  UNION {P[i] : i \in Nat}

(***************************************************************************)
(* Inv is the complete inductive invariant.  Its invariance trivially      *)
(* implies the invariance of GFXCorrect.                                   *)
(***************************************************************************)
Inv == TypeOK /\ InvB /\ InvC /\ GFXCorrect
----------------------------------------------------------------------------
(***************************************************************************)
(* When we have a library of useful theorems about finite sets, we should  *)
(* be able to use it to prove the following simple results that are needed *)
(* for the proof.  Now, we just assume them.  The results are all obvious, *)
(* and they have been checked by TLC to make sure there are no silly       *)
(* errors in these TLA+ versions.                                          *)
(***************************************************************************)
THEOREM EmptySetCardinality == Cardinality({}) = 0
PROOF OMITTED

THEOREM PositiveCardinalityImpliesNonEmpty ==
  \A S : Cardinality(S) \in Nat /\ Cardinality(S) > 0 => S # {}
<1> SUFFICES ASSUME NEW S, Cardinality(S) \in Nat, Cardinality(S) > 0, S = {}
             PROVE  FALSE
  OBVIOUS
<1> QED
  BY EmptySetCardinality

THEOREM NonEmptySetCardinality ==
           \A S : IsFiniteSet(S) /\ S # {} => (Cardinality(S) > 0)
PROOF OMITTED

THEOREM SingletonCardinalty == \A x : Cardinality({x}) = 1
PROOF OMITTED

THEOREM SubsetFinite ==
            \A S : IsFiniteSet(S) => \A T \in SUBSET S : IsFiniteSet(T)
PROOF OMITTED

THEOREM CardType == \A S : IsFiniteSet(S) => Cardinality(S) \in Nat
PROOF OMITTED

THEOREM SubsetCardinality ==
           \A T : IsFiniteSet(T) => \A S \in SUBSET T :
                                       (S # T) => (Cardinality(S) < Cardinality(T))
PROOF OMITTED

THEOREM SubsetCardinality2 ==
           \A T : IsFiniteSet(T) =>
                    \A S \in SUBSET T :(Cardinality(S) =< Cardinality(T))
PROOF OMITTED

THEOREM IntervalFinite == \A i, j \in Int : IsFiniteSet(i..j)
PROOF OMITTED

THEOREM IntervalCardinality ==
  \A i,j \in Int : i <= j => Cardinality(i .. j) = j-i+1


THEOREM PigeonHolePrinciple ==
         \A S, T :
             /\ IsFiniteSet(S) /\ IsFiniteSet(T)
             /\ Cardinality(T) < Cardinality(S)
             => \A f \in [S -> T] :
                   \E x, y \in S : (x # y) /\ (f[x] = f[y])
PROOF OMITTED

(***************************************************************************)
(* The following is a simple corollary of Theorem PigeonHolePrinciple,     *)
(***************************************************************************)
COROLLARY InjectionCardinality ==
            \A S, T, f :
               /\ IsFiniteSet(S) /\ IsFiniteSet(T)
               /\ f \in [S -> T]
               /\ \A x, y \in S : x # y => f[x] # f[y]
               => Cardinality(S) =< Cardinality(T)
BY PigeonHolePrinciple, CardType, SMT

(***************************************************************************)
(* The theorems above were checked for silly mistakes by having TLC check  *)
(* that with this definition, Test equals <<TRUE, ...  , TRUE>>.           *)
(***************************************************************************)
Test ==
<<
   EmptySetCardinality,
   \A S \in SUBSET (0..3) : NonEmptySetCardinality!(S),
   SingletonCardinalty!("abc"),
   \A S \in SUBSET (0..3) : SubsetFinite!(S),
   \A S \in SUBSET (0..3) : CardType!(S),
   \A T \in SUBSET (0..3) : SubsetCardinality!(T),
   \A T \in SUBSET (0..3) : SubsetCardinality2!(T),
   \A i, j \in ((-4)..4) : IntervalFinite!(i, j),
   \A i, j \in ((-4)..4) : IntervalCardinality!(i, j),
   \A S, T \in SUBSET (0..3) : PigeonHolePrinciple!(S, T)
>>
------------------------------------------------------------------------------
LEMMA NotAProcProp == NotAProc \notin Proc
BY NoSetContainsEverything DEF NotAProc

USE DEF NUnion

(***************************************************************************)
(* The following theorem asserts the invariance of Inv.  This obviously    *)
(* implies the invariance of GFXCorrect.                                   *)
(***************************************************************************)
THEOREM Invariance == Spec => []Inv
<1>1. Init => Inv
  <2> USE DEF Init, Inv, TypeOK, ProcSet, ReadyToWrite, WriterAssignment, PV, PA1
  <2>1. Init => TypeOK
    BY SMT
  <2>2. Init => InvB
    <3>1. ASSUME Init
          PROVE  InvB!1
      BY <3>1,  EmptySetCardinality, (* SingletonCardinalty,*) SMT DEF InvB
    <3>2. ASSUME Init
          PROVE InvB!2
      <4>1. \A p \in Proc : Cardinality(known[p]) = 1
        BY <3>2, SingletonCardinalty  \* SMT fails on this
      <4>2. QED
        BY <3>2, <4>1, SMT DEF InvB
    <3>3. QED
      BY <3>1, <3>2 DEF InvB
  <2>3. Init => InvC
    <3> SUFFICES ASSUME Init, NEW p \in Proc
                 PROVE  ~(Cardinality(result[p]) > 0)
      BY DEF InvC
    <3> QED
      BY EmptySetCardinality, SMT
  <2>4. Init => GFXCorrect
    BY SMT DEF GFXCorrect
  <2>5. QED
    BY <2>1, <2>2, <2>3, <2>4

<1>2. Inv /\ [Next]_vars => Inv'
  <2>1. Inv /\ UNCHANGED vars => Inv'
    <3> SUFFICES ASSUME Inv, vars' = vars
                 PROVE  Inv'
      OBVIOUS
    <3>1. TypeOK'
      BY SMT DEF Inv, TypeOK, ProcSet, ReadyToWrite,
               WriterAssignment, PA1, PV, vars
    <3>2. InvB'
      BY SMT DEF Inv, TypeOK, InvB, PA1, PV, vars
    <3>3. InvC'
      <4> WriterAssignment' = WriterAssignment
        BY DEF WriterAssignment, ReadyToWrite, vars
      <4> QED
        BY DEF Inv, InvC, PA1, PV, vars \* SMT Failed
    <3>4. GFXCorrect'
      BY DEF Inv, GFXCorrect, Done, vars
    <3>5. QED
      BY <3>1, <3>2, <3>3, <3>4 DEF Inv
  <2>2. Inv /\ Next => Inv'
    <3> SUFFICES ASSUME Inv, Next
                 PROVE  Inv'
      OBVIOUS
    <3>1. IsFiniteSet(snapshot) /\ (snapshot \subseteq Proc)
      BY ONLY TypeOK, ProcFinite, SubsetFinite, SMT DEF Inv, TypeOK, snapshot
    <3>2. \A p \in Proc : Cardinality(known[p]) \in Nat
      BY ProcFinite, SubsetFinite, CardType, SMT DEF Inv, TypeOK
    <3>3. TypeOK'
      <4> USE DEF Inv, TypeOK
      <4>1. ASSUME NEW p \in Proc, a(p)
            PROVE  TypeOK'
        <5>1. (A1 \in [Nat -> SUBSET Proc])'
          BY <4>1, <3>1, CardType, ProcFinite, SubsetFinite, Z3 DEF a
        <5>2. (result \in [Proc -> SUBSET Proc])'
          BY <4>1, known'[p] \in SUBSET Proc DEF a
        <5>3. (pc \in [Proc -> {"a", "b", "Done"}])'
          BY <4>1, <3>1, CardType, ProcFinite, SubsetFinite DEF a
        <5>4. (known \in [Proc -> SUBSET Proc])'
          BY <4>1, <3>1, CardType, ProcFinite, SubsetFinite, Z3 DEF a
        <5>5. (notKnown \in [Proc -> SUBSET Nat])'
          BY <4>1, <3>1, CardType, ProcFinite, SubsetFinite, Z3 DEF a
        <5>6. (\A p_1 \in Proc : (pc[p_1] = "b") => (notKnown[p_1] # {}))'
          BY <4>1, <3>1, CardType, ProcFinite, SubsetFinite DEF a
        <5>7. QED
          BY <5>1, <5>2, <5>3, <5>4, <5>5, <5>6 DEF TypeOK
      <4>2. ASSUME NEW p \in Proc, b(p)
            PROVE  TypeOK'
        BY <4>2, SMT DEF b
      <4>3 QED
        BY <2>1, <4>1, <4>2 DEF Next, Pr, ProcSet
    <3> USE DEF Inv, ProcSet \* , ReadyToWrite, PotentialValues, PA1
    <3>4. IsFiniteSet(snapshot') /\ (snapshot' \subseteq Proc)
      <4>1. snapshot' \subseteq Proc
        BY <3>3, ProcFinite, SubsetFinite, SMT DEF Inv, TypeOK, snapshot
      <4>2. IsFiniteSet(snapshot')
        BY <4>1, ProcFinite, SubsetFinite  DEF snapshot
      <4>3. QED
        BY <4>1, <4>2
    <3>5. \A p \in Proc : Cardinality(known'[p]) \in Nat
      BY <3>3, ProcFinite, SubsetFinite, CardType, SMT DEF Inv, TypeOK
    <3> DEFINE InvCI(q, P) == InvC!(q)!1!2!(P)
               Snapshot(P) == UNION {P[i] : i \in Nat}
    (***********************************************************************)
    (* The following step is used only in the proof of InvC' for a b(p)    *)
    (* action in the proof of <3>8.  It could probably also be used to     *)
    (* simplify the proof of one or more cases in the proof of InvC' for   *)
    (* an a(p) action.                                                     *)
    (***********************************************************************)
    <3>6. ASSUME NEW p \in Proc, NEW q \in Proc \ {p},
                 Cardinality(result'[q]) > 0,
                 \A qq \in Proc \ {p} : /\ known'[qq]  = known[qq]
                                        /\ notKnown'[qq]    = notKnown[qq]
                                        /\ pc'[qq]     = pc[qq]
                                        /\ result'[qq] = result[qq],
                 pc'[p] # "b",
                 NEW P \in PA1
          PROVE  InvCI(q, P)'
      <4> DEFINE S == result[q]
                 k == Cardinality(result[q])
      <4>1. /\  IsFiniteSet(S')
            /\  k' \in Nat
        BY <3>3, ProcFinite, SubsetFinite, CardType, SMT DEF TypeOK
      <4>2. S = S' /\ k = k'
        BY <3>6, SMT DEF TypeOK
      <4>3. \A i \in Nat : ~ReadyToWrite(i, p)'
        BY <3>6 DEF ReadyToWrite
      <4>4. \A i \in Nat : {r \in Proc : ReadyToWrite(i, r)'} \subseteq
                             {r \in Proc : ReadyToWrite(i, r)}
        BY <3>6, <4>3, SMT DEF ReadyToWrite, TypeOK
      <4>5. result[q] = result'[q]
        BY <3>6 DEF TypeOK
      <4>6. InvCI(q, P)
        BY <3>6 DEF InvC
      <4>7. CASE S \subseteq Snapshot(P)
        BY <4>7, <4>2, <4>1, <4>4, <4>3, <3>6, SMT DEF TypeOK
      <4>8. CASE Cardinality( UNION {P[i] : i \in Nat} ) > Cardinality(S)
        BY <4>2, <4>8
      <4>9. QED
        BY <4>6, <4>7, <4>8
    <3>7. ASSUME NEW p \in Proc, a(p)
          PROVE  Inv'
      <4> USE DEF Inv
      <4>1. InvB'
        <5>1. (\A i \in Nat : (A1[i] # {}) => (Cardinality(A1[i]) >= i))'
          BY <3>1, <3>2, <3>5, <3>7, Z3 DEF a, TypeOK, InvB
        <5>2. (\A p_1 \in Proc :
                 /\ (pc[p_1] = "b") => \A i \in notKnown[p_1] : i =< Cardinality(known[p_1])
                 /\ p_1 \in known[p_1]
                 /\ (result[p_1] # {}) <=> (pc[p_1] = "Done")
                 /\ (result[p_1] # {}) => (result[p_1] = known[p_1]))'
          <6> SUFFICES ASSUME NEW p_1 \in Proc
                       PROVE  (/\ (pc[p_1] = "b") => \A i \in notKnown[p_1] : i =< Cardinality(known[p_1])
                               /\ p_1 \in known[p_1]
                               /\ (result[p_1] # {}) <=> (pc[p_1] = "Done")
                               /\ (result[p_1] # {}) => (result[p_1] = known[p_1]))'
            OBVIOUS
          <6>1. ((pc[p_1] = "b") => \A i \in notKnown[p_1] : i =< Cardinality(known[p_1]))'
            <7> CASE p_1 = p
              BY <3>1, <3>2, <3>5, <3>7 DEF a, TypeOK, InvB
            <7> CASE p_1 # p
              BY <3>1, <3>2, <3>5, <3>7 DEF a, TypeOK, InvB
            <7> QED OBVIOUS
          <6>2. (p_1 \in known[p_1])'
            BY <3>1, <3>2, <3>5, <3>7, Z3 DEF a, TypeOK, InvB
          <6>3. ((result[p_1] # {}) <=> (pc[p_1] = "Done"))'
            <7> CASE p_1 = p
              BY <3>1, <3>2, <3>5, <3>7 DEF a, TypeOK, InvB
            <7> CASE p_1 # p
              BY <3>1, <3>2, <3>5, <3>7, pc'[p_1] = pc[p_1], result'[p_1] = result[p_1] DEF a, TypeOK, InvB
            <7> QED OBVIOUS
          <6>4. ((result[p_1] # {}) => (result[p_1] = known[p_1]))'
            BY <3>1, <3>2, <3>5, <3>7 DEF a, TypeOK, InvB
          <6>5. QED
            BY <6>1, <6>2, <6>3, <6>4
        <5>3. QED
          BY <5>1, <5>2 DEF InvB
      <4>2. InvC'
        <5> SUFFICES ASSUME NEW q \in Proc, Cardinality(result'[q]) > 0,
                            NEW P \in PA1'
                     PROVE  InvCI(q, P)'
            (***************************************************************)
            (* The goal is the body of the \A p \in Proc : quantifier with *)
            (* q substituted for p.                                        *)
            (***************************************************************)
          BY DEF InvC
        <5> (pc[p] = "a") /\ (A1' = A1)
          BY <3>7 DEF a
        <5> DEFINE S == result[q]
                   k == Cardinality(result[q])
                   InvA1q(Q) == \/ S \subseteq Snapshot(P)
                                \/ Cardinality( UNION {Q[i] : i \in Nat} ) > Cardinality(S)
        <5>1. /\  IsFiniteSet(S')
              /\  k' \in Nat
          BY <3>3(*TypeOK'*), ProcFinite, SubsetFinite, CardType, SMT DEF TypeOK
        <5>2. \A r \in Proc :
                /\ IsFiniteSet(result[r])
                /\ IsFiniteSet(result'[r])
                /\ IsFiniteSet(known[r])
                /\ IsFiniteSet(known'[r])
                /\ Cardinality(result[r]) \in Nat
                /\ Cardinality(result'[r]) \in Nat
                /\ Cardinality(known[r]) \in Nat
                /\ Cardinality(known'[r]) \in Nat
          BY  <3>3(*TypeOK'*), ProcFinite, SubsetFinite, CardType, SMT DEF TypeOK
        <5>3. CASE /\ known' = [known EXCEPT ![p]
                                 = known[p] \cup UNION {A1[i] : i \in Nat}]
                   /\ notKnown' =
                        [notKnown EXCEPT ![p] =
                            {i \in 0..(Cardinality(known'[p])) :
                                    known'[p] # A1[i]}]
                   /\ notKnown'[p] # {}
                   /\ pc' = [pc EXCEPT ![p] = "b"]
                   /\ UNCHANGED result
          <6>1. ASSUME NEW Q \in PA1
                PROVE  /\ IsFiniteSet(Snapshot(Q))
                       /\ Cardinality(Snapshot(Q)) \in Nat
            <7> PICK wa \in WriterAssignment : Q = PV(wa)
              BY DEF PA1
            <7>1. \A i \in Nat : wa[i] # NotAProc => wa[i] \in Proc
               BY DEF WriterAssignment
            <7>2. \A i \in Nat : PV(wa)[i] \in SUBSET Proc
              BY <7>1, <3>3(*TypeOK'*), SMT DEF PV, TypeOK
            <7>3. UNION {Q[j] : j \in Nat} \subseteq Proc
              BY <7>2, SMT
            <7>4. IsFiniteSet(UNION {Q[j] : j \in Nat})
              BY <7>3, ProcFinite, SubsetFinite  \* SMT failed on this.
            <7>5. QED
              BY <7>4, CardType(*, SMT*)  \** sm: SMT fails here
          <6>2. A1 \in PA1
            <7> DEFINE wa == [i \in Nat |-> NotAProc]
            <7>1. wa \in WriterAssignment
                BY SMT, NotAProcProp DEF WriterAssignment
            <7>2. PV(wa) = A1
              BY DEF TypeOK, PV
            <7>3. QED
             BY  <7>1, <7>2 DEF PA1
          <6>3. /\ p # q
                /\ S = S'
            <7>1. result'[q] # {}
              BY (k' > 0), <5>1, PositiveCardinalityImpliesNonEmpty
            <7>2. result'[p] = {}
              BY  <5>3, (* <8>1,*) <4>1(*InvB'*), SMT DEF TypeOK, InvB  \* sm: triviality check doesn't get InvB'
            <7>3. QED
              BY <7>1, <7>2, <5>3, SMT DEF TypeOK
          <6>4. /\ IsFiniteSet(UNION {P[i] : i \in Nat})
                /\ Cardinality(UNION {P[i] : i \in Nat}) \in Nat
            <7> PICK wa \in WriterAssignment' : P = PV(wa)'
              BY DEF PA1
            <7>1. \A i \in Nat : wa[i] # NotAProc => wa[i] \in Proc
               BY DEF WriterAssignment
            <7>2. \A i \in Nat : PV(wa)'[i] \in SUBSET Proc
              BY <7>1, <3>3(*TypeOK'*), SMT DEF PV, TypeOK
            <7>3. UNION {P[j] : j \in Nat} \subseteq Proc
              BY <7>2, SMT
            <7>4. IsFiniteSet(UNION {P[j] : j \in Nat})
              BY <7>3, ProcFinite, SubsetFinite  \* SMT failed on this.
            <7>5. QED
              BY <7>4, CardType \* SMT fails here
          <6>5. CASE P \in PA1
            <7> InvCI(q, P)
              BY <6>3, <6>5, <5>3, SMT DEF InvC
            <7> QED
              BY <5>3, <6>3
          <6>6. CASE P \notin PA1
            <7>1. PICK j \in Nat : P[j] = known'[p]
              <8> SUFFICES ASSUME \A i \in Nat : P[i] # known'[p]
                           PROVE  P \in PA1
                BY <6>6
              <8> PICK wa \in WriterAssignment' : P = PV(wa)'
                BY DEF PA1
              <8>1. \A i \in Nat : wa[i] # p
                BY NotAProcProp, SMT DEF PV
              <8>2. PV(wa)' = PV(wa)
                BY <8>1, <5>3, SMT DEF TypeOK, PV, WriterAssignment
                \* DEF PV added 31 May 2013
                \** DEF WriterAssignment added 2013-06-25
              <8>3. wa \in WriterAssignment
                <9>1. ASSUME NEW i \in Nat, wa[i] \in Proc
                      PROVE  ReadyToWrite(i, wa[i])
                  <10>1. ReadyToWrite(i, wa[i])' => ReadyToWrite(i, wa[i])
                    BY <8>1, <5>3, wa[i] \in Proc, Z3 DEF TypeOK, ReadyToWrite
                    \** wa[i] \in Proc added 2013-06-25
                  <10>2. QED
                    BY <9>1, <10>1, SMT DEF WriterAssignment
                <9>2. QED
                  BY <9>1, SMT DEF WriterAssignment
              <8>4. QED
                BY <8>2, <8>3, SMT DEF PA1
            <7>2. Snapshot(A1) \subseteq known'[p]
              BY <5>3, SMT DEF snapshot, TypeOK
            <7>3. \/ Cardinality(Snapshot(A1)) > k
                  \/ S \subseteq Snapshot(A1)
              BY <6>2, <6>3 DEF InvC, TypeOK    \* SMT fails here
            <7>4. \/ Cardinality(P[j]) > k
                  \/ S \subseteq P[j]
              <8>1. CASE Cardinality(Snapshot(A1)) > k
                <9>1. IsFiniteSet(known[p])
                  BY ProcFinite, SubsetFinite, SMT DEF TypeOK
                <9>2. Cardinality(Snapshot(A1)) =< Cardinality(known'[p])
                  BY <9>1, <7>2, <5>2, SubsetCardinality2
                <9> Cardinality(known[p]) \in Nat
                  BY <9>1, CardType
                <9> Cardinality(Snapshot(A1)) \in Nat
                  BY <6>1, <6>2, CardType
                <9> k \in Nat
                  BY <6>3, <5>1
                <9>3. QED
                BY <5>2, <7>1, <9>2, <8>1, SMT
              <8>2. CASE S \subseteq Snapshot(A1)
                BY <8>2, <6>1, <6>2, <7>1, <7>2, <7>3, CardType,
                 ProcFinite, SubsetFinite, SubsetCardinality2, SMT DEF TypeOK
              <8>3. QED
                 BY <8>1, <8>2, <7>3
            <7>5. P[j] \subseteq Snapshot(P)
              BY <5>1, <6>3 DEF TypeOK
            <7>6. QED
              <8>1. CASE Cardinality(P[j]) > k
                <9> /\ IsFiniteSet(Snapshot(P))
                    /\ Cardinality(Snapshot(P)) \in Nat
                    BY <6>4
                <9> /\ Cardinality(P[j]) \in Nat
                  BY <7>1, <3>3(*TypeOK'*), ProcFinite, SubsetFinite, CardType DEF TypeOK
                <9> /\ k \in Nat
                  BY ProcFinite, SubsetFinite, CardType DEF TypeOK
                <9> Cardinality(P[j]) =< Cardinality(Snapshot(P))
                  BY <7>5, <6>1, SubsetCardinality2, SMT
                <9> QED
                  BY <8>1, <7>1, <5>3, SMT DEF TypeOK
              <8>2. CASE S \subseteq P[j]
                BY <8>2, <7>5, <5>3, SMT DEF TypeOK
              <8>3. QED
                BY <8>1, <8>2, <7>4
          <6>7. QED
            BY <6>5, <6>6
        <5>4. CASE /\ known' = [known EXCEPT ![p]
                                 = known[p] \cup UNION {A1[i] : i \in Nat}]
                   /\ notKnown' =
                        [notKnown EXCEPT ![p] =
                            {i \in 0..(Cardinality(known'[p])) :
                                 known'[p] # A1[i]}]
                   /\ notKnown'[p] = {}
                   /\ result' = [result EXCEPT ![p] = known'[p]]
                   /\ pc' = [pc EXCEPT ![p] = "Done"]
          <6>2. PA1' = PA1
            <7>1. ASSUME NEW i \in Nat, NEW r \in Proc
                  PROVE  ReadyToWrite(i, r)' = ReadyToWrite(i, r)
              BY <5>4, SMT DEF ReadyToWrite, TypeOK
            <7>2. WriterAssignment' = WriterAssignment
              BY <7>1, SMT DEF WriterAssignment
            <7>3. ASSUME NEW wa \in WriterAssignment, NEW i \in Nat,
                         wa[i] # NotAProc
                  PROVE  known'[wa[i]] = known[wa[i]]
              <8> USE <7>3
              <8>1. ReadyToWrite(i, wa[i])
                BY NotAProcProp, SMT DEF WriterAssignment
              <8>2. wa[i] # p
                BY <5>4, <8>1, SMT DEF ReadyToWrite
              <8>3. wa[i] \in Proc
                BY SMT DEF WriterAssignment
              <8>4. QED
                BY <8>2, <8>3, <5>4, SMT DEF TypeOK
            <7>4. A1' = A1
              BY <5>4
            <7>5. QED
              <8> SUFFICES ASSUME NEW wa \in WriterAssignment,
                                  NEW i \in Nat
                           PROVE  PV(wa)[i] = PV(wa)[i]'
                <9> ASSUME NEW wa \in WriterAssignment
                    PROVE  /\ PV(wa) =  [i \in Nat |-> PV(wa)[i]]
                           /\ PV(wa)' = [i \in Nat |-> PV(wa)[i]]
                  BY DEF PV
                <9> QED
                  BY <7>2 DEF PA1
              <8>1. CASE wa[i] = NotAProc
                BY <8>1, <7>4 DEF PA1, PV
              <8>2. CASE wa[i] # NotAProc
                BY <8>2, <7>3 DEF PA1, PV
              <8>3. QED
                BY <8>1, <8>2
          <6>3. SUFFICES ASSUME p = q
                         PROVE  InvCI(q, P)'
            <7> SUFFICES ASSUME p # q
                         PROVE  InvCI(q, P)'
                OBVIOUS
            <7> SUFFICES ASSUME result'[q] # {}
                         PROVE  InvCI(q, P)'
              OBVIOUS
            <7> Cardinality(result'[q]) > 0
              BY <5>2, NonEmptySetCardinality, SMT
            <7> result'[q] = result[q]
              BY <5>4, SMT DEF TypeOK
            <7> InvCI(q, P)
              BY <6>2, SMT DEF InvC
            <7> QED
              BY <6>2, SMT
          <6>4. /\ \A i \in 0..Cardinality(known'[p]) : known'[p] = A1[i]
                /\ known'[p] = NUnion(A1)
                /\ Cardinality(known'[p]) >= 0
            <7>1. \A i \in 0..Cardinality(known'[p]) : known'[p] = A1[i]
               <8> /\ notKnown'[p] = {i \in 0..Cardinality(known'[p]) :
                                          known'[p] # A1[i]}
                   /\ notKnown'[p] = {}
                 BY <5>4, SMT DEF TypeOK
               <8> QED
                 OBVIOUS
            <7>2. Cardinality(known'[p]) >= 0
              BY <5>2, <4>1(*InvB'*), NonEmptySetCardinality, SMT DEF InvB   \** sm: triviality check
            <7>3. known'[p] = A1[0]
              BY <5>2, <7>1, <7>2, SMT DEF TypeOK
            <7>4. NUnion(A1) \subseteq known'[p]
              BY <5>4 DEF NUnion, TypeOK
            <7>5. NUnion(A1) = known'[p]
              BY <7>3, <7>4 DEF NUnion
            <7>6. QED
              BY <7>1, <7>2, <7>5
          <6>5. CASE \E i \in 0..Cardinality(known'[p]) : P[i] = A1[i]
            <7>1. PICK i \in 0..Cardinality(known'[p]) : P[i] = A1[i]
              BY <6>5    \* sm: original proof, certainly a typo -- BY <6>4
            <7>2. A1[i] \subseteq NUnion(P)
              BY <7>1, SMT DEF NUnion, TypeOK
            <7>3. known'[p] \subseteq NUnion(P)
              BY <7>2, <6>4
            <7>4. result'[p] = known'[p]
              BY <5>4, SMT DEF TypeOK
            <7>5. QED
              BY <7>3, <7>4, <6>3
          <6>6. CASE \A i \in 0..Cardinality(known'[p]) : P[i] # A1[i]
            <7> PICK wa \in WriterAssignment : P = PV(wa)
              BY <6>2 DEF PA1
            <7>1. \A i \in 0..Cardinality(known'[p]) : /\ wa[i] # NotAProc
                                                       /\ P[i] = known[wa[i]]
              BY <6>6, SMT DEF PV
            <7>2. \A i \in 0..Cardinality(known'[p]) : /\ wa[i] \in Proc
                                                       /\ ReadyToWrite(i, wa[i])
              BY <7>1, NotAProcProp, SMT DEF WriterAssignment
            <7>3. \A i, j \in 0..Cardinality(known'[p]) : i # j => wa[i] # wa[j]
              BY <5>2, <7>2, SMT DEF WriterAssignment
            <7>4. \A i \in 0..Cardinality(known'[p]) : wa[i] \in P[i]
              BY <7>1, <7>2, Z3 DEF InvB
            <7>6. /\ IsFiniteSet( UNION {P[i] : i \in Nat} )
                  /\ Cardinality( UNION {P[i] : i \in Nat} ) \in Nat
              <8>1. \A i \in Nat : wa[i] # NotAProc => wa[i] \in Proc
                 BY DEF WriterAssignment
              <8>2. \A i \in Nat : PV(wa)'[i] \in SUBSET Proc
                BY <8>1, <3>3(*TypeOK'*), SMT DEF PV, TypeOK
              <8>3. UNION {P[j] : j \in Nat} \subseteq Proc
                <9> SUFFICES ASSUME NEW j \in Nat PROVE P[j] \subseteq Proc
                  OBVIOUS
                <9>1. wa[j] = NotAProc \/ wa[j] \in Proc
                  BY SMT DEF WriterAssignment
                <9>2. QED
                BY <9>1, SMT DEF TypeOK, PV
              <8>4. IsFiniteSet(UNION {P[j] : j \in Nat})
                BY <8>3, ProcFinite, SubsetFinite  \* SMT failed on this.
              <8>5. QED
                BY <8>4, CardType   \*  SMT fails here
            <7>5. Cardinality( UNION {P[i] : i \in Nat} ) >= Cardinality(known'[p]) + 1
              <8> DEFINE C == Cardinality(known'[p])
                         SS == 0..C
                         TT == UNION {P[i] : i \in SS}
                         UU == UNION {P[i] : i \in Nat}
                         f == [i \in 0..C |-> wa[i]]
              <8> SUFFICES Cardinality(UU) >= C+1
                OBVIOUS
              <8>1. /\ C \in Nat
                    /\ SS \subseteq Nat
                    /\ IsFiniteSet(SS)
                    /\ Cardinality(SS) = C+1
                BY <5>2, IntervalCardinality, IntervalFinite, SMT
              <8>2. /\ TT \subseteq  UU
                    /\ IsFiniteSet(UU)
                    /\ IsFiniteSet(TT)
                BY <7>6, <8>1, SubsetFinite, Z3 \* SMT used to work but now fails
              <8>3. f \in [SS -> TT]
                BY <7>4, SMT
              <8>4. \A x, y \in SS : (x # y) => (f[x] # f[y])
                BY <7>3, SMT
              <8> HIDE DEF SS, TT, UU, C, f
              <8>5. Cardinality(SS) =< Cardinality(TT)
                BY <8>1, <8>2, <8>3, <8>4, InjectionCardinality  \* SMT fails here
              <8>6. /\ Cardinality(TT) =< Cardinality(UU)
                    /\ Cardinality(UU) \in Nat
                    /\ Cardinality(TT) \in Nat
                BY <8>2, CardType, SubsetCardinality2, SMT
              <8>7. QED
                BY <8>1, <8>5, <8>6, SMT
            <7>7. QED
              <8> result'[p] = known'[p]
                BY <5>4, SMT DEF TypeOK
              <8> QED
                BY <5>2, <6>3, <7>5, <7>6, SMT
          <6>7. QED
            BY <6>5, <6>6
        <5>5. QED
          BY <3>7, <5>3, <5>4 DEF a
      <4>3. GFXCorrect'
        <5>1. CASE UNCHANGED result
             (**************************************************************)
             (* This handles the IF/THEN case.                             *)
             (**************************************************************)
          BY <5>1, SMT DEF TypeOK, GFXCorrect, Done
        <5>2. CASE /\ known' = [known EXCEPT ![p]
                                 = known[p] \cup UNION {A1[i] : i \in Nat}]
                   /\ notKnown' =
                        [notKnown EXCEPT ![p] =
                            {i \in 0..(Cardinality(known'[p])) :
                                 known'[p] # A1[i]}]
                   /\ notKnown'[p] = {}
                   /\ result' = [result EXCEPT ![p] = known'[p]]
                   /\ pc' = [pc EXCEPT ![p] = "Done"]
                   /\ A1' = A1
              (*************************************************************)
              (* This is the IF/ELSE case (simplified).                    *)
              (*************************************************************)
          <6> SUFFICES ASSUME NEW q \in Proc, NEW r \in Proc,
                              q # r,
                              Done(q)' /\ Done(r)',
                              Cardinality(result'[q]) = Cardinality(result'[r])
                       PROVE  result'[q] = result'[r]
            BY DEF GFXCorrect
          <6>1. CASE p \notin {q, r}
            <7>1. /\ result'[q] = result[q]
                  /\ result'[r] = result[r]
                  /\ Done(q)' = Done(q)
                  /\ Done(r)' = Done(r)
              BY <5>2, <6>1  DEF TypeOK, Done
            <7>2. QED
              BY <7>1, SMT DEF GFXCorrect, TypeOK
          <6>2. CASE p \in {q, r}
            <7> SUFFICES ASSUME NEW s \in Proc,
                                p # s,
                                Done(p)' /\ Done(s)',
                                Cardinality(result'[p]) = Cardinality(result'[s])
                         PROVE  result'[p] = result'[s]
               \* Zenon or Isabelle used to prove this in one step, but on
               \* 31 May 2013 it no longer did and the proof had to be decomposed.
               <8>1. CASE p = q
                  BY <8>1
               <8>2. CASE p = q
                  BY <8>2
               <8>3. QED
                 BY <8>1, <8>2, <6>2

            <7>1. /\ result'[s] = result[s]
                  /\ Done(s)
              BY <5>2 DEF TypeOK, Done
            <7> DEFINE S == result[s]
                       k == Cardinality(result[s])
            <7>2. /\ k \in Nat
                  /\ k > 0
              BY <7>1, ProcFinite, SubsetFinite, CardType, NonEmptySetCardinality, SMT DEF TypeOK, Done
            <7>3. \/ S \subseteq Snapshot(A1)
                  \/ Cardinality( UNION {A1[i] : i \in Nat} ) > Cardinality(S)
              <8>1. InvC!(s)!1!2
                BY <7>2, InvC DEF InvC
              <8>2. A1 \in PA1
                <9> DEFINE wa == [i \in Nat |-> NotAProc]
                <9>1. wa \in WriterAssignment
                    BY SMT, NotAProcProp DEF WriterAssignment
                <9>2. PV(wa) = A1
                  BY DEF TypeOK, PV
                <9>3. QED
                 BY  <9>1, <9>2 DEF PA1
              <8>3. QED
                BY <8>1, <8>2
            <7>4. result'[p] = A1[k]
              <8>1. result'[p] = known'[p]
                BY <5>2, SMT DEF TypeOK
              <8>2. k \in 0..Cardinality(known'[p])
                BY <8>1, <7>1, <7>2, SMT
              <8>3. \A i \in 0..Cardinality(known'[p]) : known'[p] = A1[i]
                BY <5>2, SMT DEF TypeOK
              <8>4. known'[p] = A1[k]
                BY <8>2, <8>3, SMT DEF TypeOK
              <8>5. QED
                BY <8>1, <8>4
            <7>5. result'[p] = UNION {A1[i] : i \in Nat}
              <8>1. UNION {A1[i] : i \in Nat} \subseteq result'[p]
                BY <5>2, <7>2 , SMT DEF TypeOK
              <8>2. result'[p] \subseteq UNION {A1[i] : i \in Nat}
                BY <7>2, <7>4, SMT
              <8>3. QED
                BY <8>1, <8>2
            <7>6. Cardinality( UNION {A1[i] : i \in Nat} ) = k
              BY <7>1, <7>5
            <7>7. S \subseteq result'[p]
              BY <7>2, <7>3, <7>5, <7>6, SMT
            <7>8. IsFiniteSet(result'[p])
              BY <3>3(*TypeOK'*), ProcFinite, SubsetFinite, SMT DEF TypeOK
            <7>9. S = result'[p]
              <8> (Cardinality(S) = k) /\ (Cardinality(result'[p]) = k)
                BY  <7>5, <7>6  \* SMT fails here
              <8> ~ (Cardinality(S) < Cardinality(result'[p]))
                 BY  <7>2, <7>5, <7>6, <7>7, <7>8, SubsetCardinality, SMT
              <8> QED
                BY  <7>2, <7>5, <7>6, <7>7, <7>8, SubsetCardinality, SMT
            <7>10. QED
              BY <7>1, <7>9
          <6>3. QED
            BY <6>1, <6>2
       <5>3. QED
        BY <5>1, <5>2, <3>7 DEF a
      <4>4. QED
        BY <3>3, <4>1, <4>2, <4>3 DEF Inv
    <3>8. ASSUME NEW p \in Proc, b(p)
          PROVE  Inv'
      <4> USE b(p) DEF Inv
      <4>1. InvB'
        <5>1. InvB!1'
          BY DEF TypeOK, InvB, b
        <5>2. InvB!2'
          BY (*<3>1, <3>2, <3>5, <3>8,*) SMT DEF b, TypeOK, InvB   \* sm: SMT fails here when given unnecessary facts
        <5>3. QED
          BY <5>1, <5>2 DEF InvB
      <4>2. InvC'
        (*******************************************************************)
        (* Since b(p) just removes p from ReadyToWrite(nextwr[p]) and sets *)
        (* A1[i] to known[p], PA1' is a subset of PA1.  Since no other     *)
        (* relevant variables are changed, InvC!(q)!1!2(P) is left         *)
        (* unchanged for any P in PA1.                                     *)
        (*******************************************************************)
        <5> SUFFICES ASSUME NEW q \in Proc, Cardinality(result'[q]) > 0,
                            NEW P \in PA1'
                     PROVE  InvCI(q, P)'
            (***************************************************************)
            (* The goal is the body of the \A p \in Proc : quantifier with *)
            (* q substituted for p.                                        *)
            (***************************************************************)
          BY DEF InvC
        <5>1. P \in PA1
          (*****************************************************************)
          (* The following proof was copied with slight modification from  *)
          (* the proof for action d in RV3.                                *)
          (*****************************************************************)
          <6> PICK wa \in WriterAssignment' : P = PV(wa)'
            BY DEF PA1
          <6>1. ASSUME NEW  i \in Nat, NEW qa \in Proc,
                       ReadyToWrite(i, qa)'
                PROVE  ReadyToWrite(i, qa)
            <7> /\ pc'[qa] = "b" => pc[qa] = "b"
                /\ notKnown' = notKnown
              BY SMT DEF b, TypeOK
            <7> QED
              BY <6>1, SMT DEF ReadyToWrite
          <6>2. wa \in WriterAssignment
            BY <6>1, SMT DEF WriterAssignment
          <6>3. PICK j \in notKnown[p] : A1' = [A1 EXCEPT ![j] = known[p]]
            BY DEF b
          <6> j \in Nat
            BY DEF TypeOK
          <6>4. CASE wa[j] # NotAProc
            <7>1. PV(wa)' = PV(wa)
              <8>1. SUFFICES ASSUME NEW i \in Nat
                             PROVE  PV(wa)'[i] = PV(wa)[i]
                BY DEF PV
              <8>2. CASE wa[i] # NotAProc
                <9> known'[wa[i]] = known[wa[i]]
                  BY DEF b
                <9> QED
                  BY <8>2 DEF PV
              <8>3. CASE wa[i] = NotAProc
                 <9> i # j
                   BY <6>4, <8>3
                 <9> A1'[i] = A1[i]
                   BY <6>3, SMT DEF TypeOK
                 <9> QED
                   BY <8>3 DEF PV
              <8>4. QED
                BY <8>2, <8>3
            <7>2. QED
              BY <6>2, <7>1 DEF PA1
          <6>5. CASE wa[j] = NotAProc
            <7> DEFINE za == [wa EXCEPT ![j] = p]
            <7>1. za \in WriterAssignment
              <8>1. \A i \in Nat : wa[i] # p
                <9> \A i \in Nat : ~ReadyToWrite(i, p)'
                  BY SMT DEF b, TypeOK, ReadyToWrite
                <9> QED
                  BY SMT DEF WriterAssignment
              <8>2. ReadyToWrite(j, p)
                BY DEF b, ReadyToWrite
              <8>3. ASSUME NEW i \in Nat, NEW  k \in Nat \ {i}, wa[i] \in Proc
                    PROVE  za[i] # za[k]
                <9> wa \in [Nat -> Proc \union {NotAProc}]
                  BY DEF WriterAssignment
                <9> CASE j \notin {i, k}
                  <10> wa[i] # wa[k]
                    BY <8>3, SMT DEF WriterAssignment
                  <10> za[i] = wa[i] /\ za[k] = wa[k]
                    OBVIOUS
                  <10> QED
                    BY <8>1, SMT
                <9> CASE j \in {i, k}
                  BY <8>1, SMT
                <9> QED
                  OBVIOUS
              <8>4. QED
                BY <6>2, <8>2, <8>3, SMT DEF WriterAssignment
            <7>2. PV(wa)' = PV(za)
              <8>1. wa = [k \in Nat |-> wa[k]]
                  BY DEF WriterAssignment
              <8>2. SUFFICES ASSUME NEW i \in Nat
                             PROVE  PV(wa)'[i] = PV(za)[i]
                BY DEF PV
              <8>3. CASE wa[i] # NotAProc
                <9>1. i # j
                  BY <6>5, <8>3
                <9>2. known'[wa[i]] = known[wa[i]]
                  BY <9>1 DEF b
                <9>3. PV(wa)'[i] = known'[wa[i]]
                  BY <8>3, SMT DEF PV
                <9>4. za[i] = wa[i]
                   BY <8>1, <9>1
                <9>5. PV(za)[i] = known[wa[i]]
                  BY <9>4, <8>3 DEF PV
                <9>6. QED
                  BY <9>2, <9>3, <9>5
              <8>4. CASE wa[i] = NotAProc
                <9>1. CASE i # j
                  <10> A1'[i] = A1[i]
                    BY <9>1, <6>3, SMT DEF TypeOK
                  <10> wa[i] = za[i]
                    BY <8>1, <9>1
                  <10> QED
                    BY <8>4, <9>1, <6>1, SMT DEF PV, WriterAssignment
                    \** 2013-06-25 DEF WriterAssignment missing
                <9>2. CASE i = j
                  <10>1. PV(wa)'[j] = A1[j]'
                    BY <9>2, <8>4 DEF PV
                  <10>2. za[j] = p
                    BY <8>1, <9>2
                  <10>3. PV(za)[j] = known[p]
                     BY <10>2, NotAProcProp, SMT DEF PV, WriterAssignment
                    \** 2013-06-25 DEF WriterAssignment missing
                  <10>4. A1'[j] = known[p]
                    BY <6>3, SMT DEF TypeOK
                  <10> HIDE DEF za
                  <10>5. QED
                    BY  <9>2, <10>1, <10>3, <10>4
                <9>3. QED
                  BY <9>1, <9>2
              <8>5. QED
                BY <8>3, <8>4
            <7>3. QED
              BY <7>1, <7>2 DEF PA1
          <6>6. QED
            BY <6>4, <6>5
        <5>2.    \A qq \in Proc \ {p} : /\ known'[qq]  = known[qq]
                                        /\ notKnown'[qq] = notKnown[qq]
                                        /\ pc'[qq]     = pc[qq]
                                        /\ result'[qq] = result[qq]
          BY <3>8, SMT DEF b, TypeOK
        <5>3. pc'[p] = "a"
          BY <3>8, SMT DEF TypeOK, b
        <5>4. q # p
          <6>1. Cardinality(result'[q]) \in Nat
            BY <3>3(*TypeOK'*), ProcFinite, SubsetFinite, CardType, SMT DEF TypeOK  \* sm: failure of triviality check
          <6>2. result'[q] # {}
            BY <6>1, PositiveCardinalityImpliesNonEmpty
          <6>3. pc'[q] = "Done"
            BY  <6>2, <4>1(*InvB'*), SMT DEF TypeOK, InvB   \* sm: failure of triviality check
          <6>4. QED
            BY <6>3, <5>3
        <5> HIDE DEF PA1, InvCI
        <5>5. InvCI(q, P)'
          BY <5>1, <5>2, <5>3, <5>4, <3>6, SMT DEF TypeOK
        <5>6. QED
          BY <5>5 DEF InvCI
      <4>3. GFXCorrect'
        BY <3>8 DEF b, TypeOK, GFXCorrect, Done
      <4>4. QED
        BY <3>3, <4>1, <4>2, <4>3
    <3> HIDE DEF Inv
    <3>9. QED
      BY <2>1, <3>7, <3>8 DEF Next, Pr, ProcSet
  <2>3. QED
    BY <2>1, <2>2

<1>3. QED
  (*************************************************************************)PROOF
  (* This follows from a <1>1, <1>2, and a simple TLA proof rule.          *)
  (*************************************************************************)OMITTED
------------------------------------------------------------------------------
(***************************************************************************)
(* The following theorem combined with theorem Invariance shows that the   *)
(* algorithm has the desired space complexity.                             *)
(***************************************************************************)
THEOREM Inv => \A i \in Nat :  (i > Cardinality(Proc)) =>  (A1[i] = {})
<1> SUFFICES ASSUME Inv, NEW i \in Nat, i > Cardinality(Proc)
             PROVE  A1[i] = {}
  OBVIOUS
<1> SUFFICES ~(Cardinality(A1[i]) \geq i)
  BY DEF Inv, InvB
<1>1. A1[i] \subseteq Proc
  BY DEF Inv, TypeOK
<1>2. /\ Cardinality(Proc) \in Nat
      /\ Cardinality(A1[i]) \in Nat
      /\ Cardinality(A1[i]) =< Cardinality(Proc)
 BY ProcFinite, SubsetFinite, CardType, SubsetCardinality2, SMT DEF Inv, TypeOK
<1>3. QED
  BY <1>2, SMT

------------------------------------------------------------------------------
(***************************************************************************)
(*                         The Refinement Proof                            *)
(***************************************************************************)
pcBar == [p \in Proc |-> IF pc[p] = "Done" THEN "Done" ELSE "A"]

(***************************************************************************)
(* For every symbol F defined in module GFXSpec, this defines PS!F to have *)
(* the same definition as F except with every defined constant and         *)
(* variable of GFXSpec replaced by the expression specified in the WITH    *)
(* clause.  Constants and variables not explicitly substituted for in the  *)
(* WITH clause are replaced by the symbols of the same name in module GFX. *)
(***************************************************************************)
PS == INSTANCE GFXSpec WITH pc <- pcBar

(***************************************************************************)
(* The following lemmas are the heart of the proof that algorithm GFX      *)
(* implements/refines algorithm GFXSpec.                                   *)
(***************************************************************************)
LEMMA InitImplication == Init => PS!Init
BY DEF Init, PS!Init, ProcSet, PS!ProcSet, pcBar

LEMMA StepSimulation ==  Inv /\ Inv' /\ [Next]_vars => [PS!Next]_PS!vars
<1> SUFFICES ASSUME Inv, Inv', [Next]_vars
             PROVE  [PS!Next]_PS!vars
  OBVIOUS
<1>1. CASE UNCHANGED vars
  BY <1>1, SMT DEF vars, PS!vars, pcBar
<1>2. ASSUME NEW p \in Proc, a(p)
      PROVE  [PS!Next]_PS!vars
  <2> pc[p] = "a"
    BY <1>2 DEF a
  <2>1. CASE /\ known' = [known EXCEPT ![p]
                           = known[p] \cup UNION {A1[i] : i \in Nat}]
             /\ notKnown' =
                  [notKnown EXCEPT ![p] =
                      {i \in 0..(Cardinality(known'[p])) : known'[p] # A1[i]}]
             /\ notKnown'[p] # {}
             /\ pc' = [pc EXCEPT ![p] = "b"]
             /\ UNCHANGED result
             /\ A1' = A1
    <3> /\ result' = result
        /\ pc' = [pc EXCEPT ![p] = "b"]
        /\ pc \in [Proc -> {"a", "b", "Done"}]
        /\ pc[p] = "a"
       BY <2>1 DEF Inv, TypeOK
    <3> /\ pcBar \in [Proc -> {"A", "Done"}]
        /\ pcBar' \in [Proc -> {"A", "Done"}]
      BY DEF pcBar
    <3> SUFFICES ASSUME NEW q \in Proc
                 PROVE  pcBar[q]' = pcBar[q]
      BY DEF PS!vars
    <3> QED
      BY DEF PS!vars, pcBar  \* SMT used to prove this but doesn't now
  <2>2. CASE /\ known' = [known EXCEPT ![p]
                           = known[p] \cup UNION {A1[i] : i \in Nat}]
             /\ notKnown' =
                  [notKnown EXCEPT ![p] =
                      {i \in 0..(Cardinality(known'[p])) : known'[p] # A1[i]}]
             /\ notKnown'[p] = {}
             /\ result' = [result EXCEPT ![p] = known'[p]]
             /\ pc' = [pc EXCEPT ![p] = "Done"]
             /\ A1' = A1
    <3>1. \A x : Cardinality(x) = PS!Cardinality(x)
        BY DEF Cardinality, PS!Cardinality
    <3>2. pcBar[p] = "A"
      BY <2>2, SMT DEF TypeOK, pcBar
    <3>3. \E P \in { Q \in SUBSET Proc :
                      /\ p \in Q
                      /\ \A q \in Proc\{p}:
                            \/ Cardinality (result[q]) # Cardinality(Q)
                            \/ Q = result[q]
                    }:
               result' = [result EXCEPT ![p] = P]
      <4> DEFINE P == known'[p]
      <4> SUFFICES /\ P \in SUBSET Proc
                   /\ p \in P
                   /\ \A q \in Proc \ {p}:
                            \/ Cardinality (result[q]) # Cardinality(P)
                            \/ P = result[q]
        BY <2>2
      <4>1. P \in SUBSET Proc
        BY DEF TypeOK, Inv
      <4>2. p \in P
        BY DEF InvB, Inv
      <4>3. ASSUME NEW q \in Proc \ {p}
            PROVE  \/ Cardinality (result[q]) # Cardinality(P)
                   \/ P = result[q]
        <5>1. /\ Cardinality(P) \in Nat
              /\ Cardinality(result[q]) \in Nat
              /\ IsFiniteSet(P)
              /\ IsFiniteSet(result[q])
          BY ProcFinite, SubsetFinite, CardType, SMT DEF Inv, TypeOK
        <5>2. /\ Cardinality(P) # 0
              /\ P # {}
          BY <4>2, <5>1, NonEmptySetCardinality, SMT DEF Done
        <5>3. CASE result[q] = {}
          BY  <5>2, <5>3, EmptySetCardinality,  SMT
        <5>4. CASE result[q] # {}
          <6>1. /\ result'[q] = result[q]
                /\ result'[p] = known'[p]
             BY <2>2, SMT DEF Inv, TypeOK
          <6>2. QED
            BY <6>1, <5>2, <5>4, SMT DEF Inv, GFXCorrect, Done
        <5>5. QED
          BY <5>3, <5>4
      <4>4. QED
        BY <4>1, <4>2, <4>3
    <3>4. pcBar' = [pcBar EXCEPT ![p] = "Done"]
      <4> /\ pcBar \in [Proc -> {"A", "Done"}]
          /\ pcBar' \in [Proc -> {"A", "Done"}]
        BY DEF pcBar
      <4> SUFFICES ASSUME NEW q \in Proc
                   PROVE  pcBar[q]' = IF q = p THEN "Done"
                                               ELSE pcBar[q]
        OBVIOUS
      <4> /\ pc' = [pc EXCEPT ![p] = "Done"]
          /\ pc \in [Proc -> {"a", "b", "Done"}]
        BY <2>2 DEF Inv, TypeOK
      <4> QED
        BY SMT DEF pcBar
    <3>5. QED
      BY  <3>1, <3>2, <3>3, <3>4 DEF PS!A, PS!Next, PS!Pr
  <2>4. QED
    BY <2>1, <2>2, <1>2 DEF a

<1>3. ASSUME NEW p \in Proc, b(p)
      PROVE UNCHANGED PS!vars
  <2> SUFFICES ASSUME NEW q \in Proc
               PROVE  pcBar[q]' = pcBar[q]
    <3> result' = result
      BY <1>3 DEF b
    <3> pcBar' = pcBar
      BY DEF pcBar
    <3> QED
     BY DEF PS!vars
  <2>1. CASE q = p
    BY <1>3, SMT DEF PS!vars, pcBar, b, Inv, TypeOK
  <2>2. CASE q # p
    BY <1>3, SMT DEF PS!vars, pcBar, b, Inv, TypeOK
  <2>3. QED
    BY <2>1, <2>2
<1>4. QED
  BY <1>1, <1>2, <1>3 DEF Next, Pr

THEOREM Spec => PS!Spec
(***************************************************************************)PROOF
(* This theorem follows easily by simple TLA reasoning from Theorem        *)
(* Invariance and Lemmas InitImplication and StepSimulation.  However,     *)
(* since TLAPS does not yet do temporal reasoning, it can't check the      *)
(* proof, so there's no point writing it out.                              *)
(***************************************************************************)OMITTED
=============================================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 194:3:194:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 194:3:194:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 194:6:194:25
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 194:6:194:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 192:3:192:10
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 192:3:192:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 14
    @loc: 244:1:244:3
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 244:1:244:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 15
    @loc: 244:4:244:23
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 244:4:244:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 244:25:244:33
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 244:25:244:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 244:35:244:38
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 244:35:244:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 18
    @loc: 265:1:265:3
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 265:1:265:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 19
    @loc: 265:4:265:27
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 265:4:265:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 21
    @loc: 299:5:299:7
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 299:5:299:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 22
    @loc: 299:8:299:12
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 299:8:299:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 23
    @loc: 299:14:299:18
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 299:14:299:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 24
    @loc: 299:20:299:24
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 299:20:299:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 25
    @loc: 299:26:299:30
    @status: to be proved

    @type: obligation
    @id: 25
    @loc: 299:26:299:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 26
    @loc: 277:5:277:7
    @status: to be proved

    @type: obligation
    @id: 26
    @loc: 277:5:277:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 27
    @loc: 277:8:277:11
    @status: to be proved

    @type: obligation
    @id: 27
    @loc: 277:8:277:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 28
    @loc: 289:7:289:9
    @status: to be proved

    @type: obligation
    @id: 28
    @loc: 289:7:289:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 29
    @loc: 289:10:289:14
    @status: to be proved

    @type: obligation
    @id: 29
    @loc: 289:10:289:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 30
    @loc: 289:16:289:20
    @status: to be proved

    @type: obligation
    @id: 30
    @loc: 289:16:289:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 31
    @loc: 281:7:281:9
    @status: to be proved

    @type: obligation
    @id: 31
    @loc: 281:7:281:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 32
    @loc: 281:10:281:14
    @status: to be proved

    @type: obligation
    @id: 32
    @loc: 281:10:281:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 33
    @loc: 281:17:281:36
    @status: to be proved

    @type: obligation
    @id: 33
    @loc: 281:17:281:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 34
    @loc: 281:64:281:67
    @status: to be proved

    @type: obligation
    @id: 34
    @loc: 281:64:281:67
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 35
    @loc: 287:9:287:11
    @status: to be proved

    @type: obligation
    @id: 35
    @loc: 287:9:287:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 36
    @loc: 287:12:287:16
    @status: to be proved

    @type: obligation
    @id: 36
    @loc: 287:12:287:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 37
    @loc: 287:18:287:22
    @status: to be proved

    @type: obligation
    @id: 37
    @loc: 287:18:287:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 38
    @loc: 287:24:287:27
    @status: to be proved

    @type: obligation
    @id: 38
    @loc: 287:24:287:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 39
    @loc: 285:9:285:11
    @status: to be proved

    @type: obligation
    @id: 39
    @loc: 285:9:285:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 40
    @loc: 285:12:285:16
    @status: to be proved

    @type: obligation
    @id: 40
    @loc: 285:12:285:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 41
    @loc: 285:18:285:37
    @status: to be proved

    @type: obligation
    @id: 41
    @loc: 285:18:285:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 42
    @loc: 295:7:295:9
    @status: to be proved

    @type: obligation
    @id: 42
    @loc: 295:7:295:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 43
    @loc: 295:10:295:29
    @status: to be proved

    @type: obligation
    @id: 43
    @loc: 295:10:295:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 44
    @loc: 295:31:295:34
    @status: to be proved

    @type: obligation
    @id: 44
    @loc: 295:31:295:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 45
    @loc: 293:7:293:9
    @status: to be proved

    @type: obligation
    @id: 45
    @loc: 293:7:293:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 46
    @loc: 297:5:297:7
    @status: to be proved

    @type: obligation
    @id: 46
    @loc: 297:5:297:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 47
    @loc: 297:8:297:11
    @status: to be proved

    @type: obligation
    @id: 47
    @loc: 297:8:297:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 48
    @loc: 1037:5:1037:7
    @status: to be proved

    @type: obligation
    @id: 48
    @loc: 1037:5:1037:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 49
    @loc: 1037:8:1037:12
    @status: to be proved

    @type: obligation
    @id: 49
    @loc: 1037:8:1037:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 50
    @loc: 1037:14:1037:18
    @status: to be proved

    @type: obligation
    @id: 50
    @loc: 1037:14:1037:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 51
    @loc: 319:7:319:9
    @status: to be proved

    @type: obligation
    @id: 51
    @loc: 319:7:319:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 52
    @loc: 319:10:319:14
    @status: to be proved

    @type: obligation
    @id: 52
    @loc: 319:10:319:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 53
    @loc: 319:16:319:20
    @status: to be proved

    @type: obligation
    @id: 53
    @loc: 319:16:319:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 54
    @loc: 319:22:319:26
    @status: to be proved

    @type: obligation
    @id: 54
    @loc: 319:22:319:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 55
    @loc: 319:28:319:32
    @status: to be proved

    @type: obligation
    @id: 55
    @loc: 319:28:319:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 56
    @loc: 305:7:305:14
    @status: to be proved

    @type: obligation
    @id: 56
    @loc: 305:7:305:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 57
    @loc: 307:7:307:9
    @status: to be proved

    @type: obligation
    @id: 57
    @loc: 307:7:307:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 58
    @loc: 307:10:307:13
    @status: to be proved

    @type: obligation
    @id: 58
    @loc: 307:10:307:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 59
    @loc: 310:7:310:9
    @status: to be proved

    @type: obligation
    @id: 59
    @loc: 310:7:310:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 60
    @loc: 310:10:310:13
    @status: to be proved

    @type: obligation
    @id: 60
    @loc: 310:10:310:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 61
    @loc: 315:9:315:11
    @status: to be proved

    @type: obligation
    @id: 61
    @loc: 315:9:315:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 62
    @loc: 313:9:313:11
    @status: to be proved

    @type: obligation
    @id: 62
    @loc: 313:9:313:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 63
    @loc: 317:7:317:9
    @status: to be proved

    @type: obligation
    @id: 63
    @loc: 317:7:317:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 64
    @loc: 1035:7:1035:9
    @status: to be proved

    @type: obligation
    @id: 64
    @loc: 1035:7:1035:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 65
    @loc: 1035:10:1035:14
    @status: to be proved

    @type: obligation
    @id: 65
    @loc: 1035:10:1035:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 66
    @loc: 1035:16:1035:20
    @status: to be proved

    @type: obligation
    @id: 66
    @loc: 1035:16:1035:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 67
    @loc: 1035:22:1035:26
    @status: to be proved

    @type: obligation
    @id: 67
    @loc: 1035:22:1035:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 68
    @loc: 323:7:323:14
    @status: to be proved

    @type: obligation
    @id: 68
    @loc: 323:7:323:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 69
    @loc: 325:7:325:9
    @status: to be proved

    @type: obligation
    @id: 69
    @loc: 325:7:325:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 70
    @loc: 325:15:325:21
    @status: to be proved

    @type: obligation
    @id: 70
    @loc: 325:15:325:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 71
    @loc: 325:23:325:33
    @status: to be proved

    @type: obligation
    @id: 71
    @loc: 325:23:325:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 72
    @loc: 325:35:325:47
    @status: to be proved

    @type: obligation
    @id: 72
    @loc: 325:35:325:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 73
    @loc: 325:49:325:52
    @status: to be proved

    @type: obligation
    @id: 73
    @loc: 325:49:325:52
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 74
    @loc: 327:7:327:9
    @status: to be proved

    @type: obligation
    @id: 74
    @loc: 327:7:327:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 75
    @loc: 327:10:327:20
    @status: to be proved

    @type: obligation
    @id: 75
    @loc: 327:10:327:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 76
    @loc: 327:22:327:34
    @status: to be proved

    @type: obligation
    @id: 76
    @loc: 327:22:327:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 77
    @loc: 327:36:327:44
    @status: to be proved

    @type: obligation
    @id: 77
    @loc: 327:36:327:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 78
    @loc: 327:46:327:49
    @status: to be proved

    @type: obligation
    @id: 78
    @loc: 327:46:327:49
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 79
    @loc: 350:9:350:11
    @status: to be proved

    @type: obligation
    @id: 79
    @loc: 350:9:350:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 80
    @loc: 350:12:350:16
    @status: to be proved

    @type: obligation
    @id: 80
    @loc: 350:12:350:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 81
    @loc: 350:18:350:22
    @status: to be proved

    @type: obligation
    @id: 81
    @loc: 350:18:350:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 82
    @loc: 350:24:350:28
    @status: to be proved

    @type: obligation
    @id: 82
    @loc: 350:24:350:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 83
    @loc: 345:11:345:13
    @status: to be proved

    @type: obligation
    @id: 83
    @loc: 345:11:345:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 84
    @loc: 345:14:345:18
    @status: to be proved

    @type: obligation
    @id: 84
    @loc: 345:14:345:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 85
    @loc: 345:20:345:24
    @status: to be proved

    @type: obligation
    @id: 85
    @loc: 345:20:345:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 86
    @loc: 345:26:345:30
    @status: to be proved

    @type: obligation
    @id: 86
    @loc: 345:26:345:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 87
    @loc: 345:32:345:36
    @status: to be proved

    @type: obligation
    @id: 87
    @loc: 345:32:345:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 88
    @loc: 345:38:345:42
    @status: to be proved

    @type: obligation
    @id: 88
    @loc: 345:38:345:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 89
    @loc: 345:44:345:48
    @status: to be proved

    @type: obligation
    @id: 89
    @loc: 345:44:345:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 90
    @loc: 333:11:333:13
    @status: to be proved

    @type: obligation
    @id: 90
    @loc: 333:11:333:13
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 91
    @loc: 333:14:333:18
    @status: to be proved

    @type: obligation
    @id: 91
    @loc: 333:14:333:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 92
    @loc: 333:20:333:24
    @status: to be proved

    @type: obligation
    @id: 92
    @loc: 333:20:333:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 93
    @loc: 333:26:333:34
    @status: to be proved

    @type: obligation
    @id: 93
    @loc: 333:26:333:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 94
    @loc: 333:36:333:46
    @status: to be proved

    @type: obligation
    @id: 94
    @loc: 333:36:333:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 95
    @loc: 333:48:333:60
    @status: to be proved

    @type: obligation
    @id: 95
    @loc: 333:48:333:60
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 96
    @loc: 333:62:333:64
    @status: to be proved

    @type: obligation
    @id: 96
    @loc: 333:62:333:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 97
    @loc: 335:11:335:13
    @status: to be proved

    @type: obligation
    @id: 97
    @loc: 335:11:335:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 98
    @loc: 335:14:335:18
    @status: to be proved

    @type: obligation
    @id: 98
    @loc: 335:14:335:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 99
    @loc: 335:20:335:45
    @status: to be proved

    @type: obligation
    @id: 99
    @loc: 335:20:335:45
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 100
    @loc: 337:11:337:13
    @status: to be proved

    @type: obligation
    @id: 100
    @loc: 337:11:337:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 101
    @loc: 337:14:337:18
    @status: to be proved

    @type: obligation
    @id: 101
    @loc: 337:14:337:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 102
    @loc: 337:20:337:24
    @status: to be proved

    @type: obligation
    @id: 102
    @loc: 337:20:337:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 103
    @loc: 337:26:337:34
    @status: to be proved

    @type: obligation
    @id: 103
    @loc: 337:26:337:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 104
    @loc: 337:36:337:46
    @status: to be proved

    @type: obligation
    @id: 104
    @loc: 337:36:337:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 105
    @loc: 337:48:337:60
    @status: to be proved

    @type: obligation
    @id: 105
    @loc: 337:48:337:60
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 106
    @loc: 339:11:339:13
    @status: to be proved

    @type: obligation
    @id: 106
    @loc: 339:11:339:13
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 107
    @loc: 339:14:339:18
    @status: to be proved

    @type: obligation
    @id: 107
    @loc: 339:14:339:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 108
    @loc: 339:20:339:24
    @status: to be proved

    @type: obligation
    @id: 108
    @loc: 339:20:339:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 109
    @loc: 339:26:339:34
    @status: to be proved

    @type: obligation
    @id: 109
    @loc: 339:26:339:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 110
    @loc: 339:36:339:46
    @status: to be proved

    @type: obligation
    @id: 110
    @loc: 339:36:339:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 111
    @loc: 339:48:339:60
    @status: to be proved

    @type: obligation
    @id: 111
    @loc: 339:48:339:60
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 112
    @loc: 339:62:339:64
    @status: to be proved

    @type: obligation
    @id: 112
    @loc: 339:62:339:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 113
    @loc: 341:11:341:13
    @status: to be proved

    @type: obligation
    @id: 113
    @loc: 341:11:341:13
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 114
    @loc: 341:14:341:18
    @status: to be proved

    @type: obligation
    @id: 114
    @loc: 341:14:341:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 115
    @loc: 341:20:341:24
    @status: to be proved

    @type: obligation
    @id: 115
    @loc: 341:20:341:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 116
    @loc: 341:26:341:34
    @status: to be proved

    @type: obligation
    @id: 116
    @loc: 341:26:341:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 117
    @loc: 341:36:341:46
    @status: to be proved

    @type: obligation
    @id: 117
    @loc: 341:36:341:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 118
    @loc: 341:48:341:60
    @status: to be proved

    @type: obligation
    @id: 118
    @loc: 341:48:341:60
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 119
    @loc: 341:62:341:64
    @status: to be proved

    @type: obligation
    @id: 119
    @loc: 341:62:341:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 120
    @loc: 343:11:343:13
    @status: to be proved

    @type: obligation
    @id: 120
    @loc: 343:11:343:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 121
    @loc: 343:14:343:18
    @status: to be proved

    @type: obligation
    @id: 121
    @loc: 343:14:343:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 122
    @loc: 343:20:343:24
    @status: to be proved

    @type: obligation
    @id: 122
    @loc: 343:20:343:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 123
    @loc: 343:26:343:34
    @status: to be proved

    @type: obligation
    @id: 123
    @loc: 343:26:343:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 124
    @loc: 343:36:343:46
    @status: to be proved

    @type: obligation
    @id: 124
    @loc: 343:36:343:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 125
    @loc: 343:48:343:60
    @status: to be proved

    @type: obligation
    @id: 125
    @loc: 343:48:343:60
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 126
    @loc: 348:9:348:11
    @status: to be proved

    @type: obligation
    @id: 126
    @loc: 348:9:348:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 127
    @loc: 348:12:348:16
    @status: to be proved

    @type: obligation
    @id: 127
    @loc: 348:12:348:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 128
    @loc: 348:18:348:21
    @status: to be proved

    @type: obligation
    @id: 128
    @loc: 348:18:348:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 129
    @loc: 358:9:358:11
    @status: to be proved

    @type: obligation
    @id: 129
    @loc: 358:9:358:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 130
    @loc: 358:12:358:16
    @status: to be proved

    @type: obligation
    @id: 130
    @loc: 358:12:358:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 131
    @loc: 358:18:358:22
    @status: to be proved

    @type: obligation
    @id: 131
    @loc: 358:18:358:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 132
    @loc: 354:9:354:11
    @status: to be proved

    @type: obligation
    @id: 132
    @loc: 354:9:354:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 133
    @loc: 354:12:354:16
    @status: to be proved

    @type: obligation
    @id: 133
    @loc: 354:12:354:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 134
    @loc: 354:18:354:28
    @status: to be proved

    @type: obligation
    @id: 134
    @loc: 354:18:354:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 135
    @loc: 354:30:354:42
    @status: to be proved

    @type: obligation
    @id: 135
    @loc: 354:30:354:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 136
    @loc: 354:44:354:47
    @status: to be proved

    @type: obligation
    @id: 136
    @loc: 354:44:354:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 137
    @loc: 356:9:356:11
    @status: to be proved

    @type: obligation
    @id: 137
    @loc: 356:9:356:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 138
    @loc: 356:12:356:16
    @status: to be proved

    @type: obligation
    @id: 138
    @loc: 356:12:356:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 139
    @loc: 356:18:356:28
    @status: to be proved

    @type: obligation
    @id: 139
    @loc: 356:18:356:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 140
    @loc: 356:30:356:42
    @status: to be proved

    @type: obligation
    @id: 140
    @loc: 356:30:356:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 141
    @loc: 360:7:360:9
    @status: to be proved

    @type: obligation
    @id: 141
    @loc: 360:7:360:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 142
    @loc: 360:10:360:14
    @status: to be proved

    @type: obligation
    @id: 142
    @loc: 360:10:360:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 143
    @loc: 360:16:360:26
    @status: to be proved

    @type: obligation
    @id: 143
    @loc: 360:16:360:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 144
    @loc: 360:28:360:40
    @status: to be proved

    @type: obligation
    @id: 144
    @loc: 360:28:360:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 145
    @loc: 360:42:360:50
    @status: to be proved

    @type: obligation
    @id: 145
    @loc: 360:42:360:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 146
    @loc: 360:52:360:55
    @status: to be proved

    @type: obligation
    @id: 146
    @loc: 360:52:360:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 147
    @loc: 399:9:399:11
    @status: to be proved

    @type: obligation
    @id: 147
    @loc: 399:9:399:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 148
    @loc: 399:12:399:16
    @status: to be proved

    @type: obligation
    @id: 148
    @loc: 399:12:399:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 149
    @loc: 399:18:399:22
    @status: to be proved

    @type: obligation
    @id: 149
    @loc: 399:18:399:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 150
    @loc: 399:24:399:28
    @status: to be proved

    @type: obligation
    @id: 150
    @loc: 399:24:399:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 151
    @loc: 382:9:382:11
    @status: to be proved

    @type: obligation
    @id: 151
    @loc: 382:9:382:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 152
    @loc: 382:12:382:16
    @status: to be proved

    @type: obligation
    @id: 152
    @loc: 382:12:382:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 153
    @loc: 382:18:382:28
    @status: to be proved

    @type: obligation
    @id: 153
    @loc: 382:18:382:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 154
    @loc: 382:30:382:42
    @status: to be proved

    @type: obligation
    @id: 154
    @loc: 382:30:382:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 155
    @loc: 382:44:382:52
    @status: to be proved

    @type: obligation
    @id: 155
    @loc: 382:44:382:52
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 156
    @loc: 382:54:382:57
    @status: to be proved

    @type: obligation
    @id: 156
    @loc: 382:54:382:57
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 157
    @loc: 384:9:384:11
    @status: to be proved

    @type: obligation
    @id: 157
    @loc: 384:9:384:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 158
    @loc: 384:12:384:16
    @status: to be proved

    @type: obligation
    @id: 158
    @loc: 384:12:384:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 159
    @loc: 384:18:384:21
    @status: to be proved

    @type: obligation
    @id: 159
    @loc: 384:18:384:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 160
    @loc: 386:9:386:11
    @status: to be proved

    @type: obligation
    @id: 160
    @loc: 386:9:386:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 161
    @loc: 386:12:386:16
    @status: to be proved

    @type: obligation
    @id: 161
    @loc: 386:12:386:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 162
    @loc: 389:9:389:11
    @status: to be proved

    @type: obligation
    @id: 162
    @loc: 389:9:389:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 163
    @loc: 389:12:389:16
    @status: to be proved

    @type: obligation
    @id: 163
    @loc: 389:12:389:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 164
    @loc: 389:18:389:22
    @status: to be proved

    @type: obligation
    @id: 164
    @loc: 389:18:389:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 165
    @loc: 389:24:389:27
    @status: to be proved

    @type: obligation
    @id: 165
    @loc: 389:24:389:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 166
    @loc: 391:9:391:11
    @status: to be proved

    @type: obligation
    @id: 166
    @loc: 391:9:391:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 167
    @loc: 391:12:391:16
    @status: to be proved

    @type: obligation
    @id: 167
    @loc: 391:12:391:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 168
    @loc: 393:9:393:11
    @status: to be proved

    @type: obligation
    @id: 168
    @loc: 393:9:393:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 169
    @loc: 393:12:393:16
    @status: to be proved

    @type: obligation
    @id: 169
    @loc: 393:12:393:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 170
    @loc: 395:9:395:11
    @status: to be proved

    @type: obligation
    @id: 170
    @loc: 395:9:395:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 171
    @loc: 395:12:395:16
    @status: to be proved

    @type: obligation
    @id: 171
    @loc: 395:12:395:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 172
    @loc: 395:18:395:22
    @status: to be proved

    @type: obligation
    @id: 172
    @loc: 395:18:395:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 173
    @loc: 395:24:395:28
    @status: to be proved

    @type: obligation
    @id: 173
    @loc: 395:24:395:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 174
    @loc: 395:30:395:34
    @status: to be proved

    @type: obligation
    @id: 174
    @loc: 395:30:395:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 175
    @loc: 395:36:395:40
    @status: to be proved

    @type: obligation
    @id: 175
    @loc: 395:36:395:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 176
    @loc: 395:42:395:46
    @status: to be proved

    @type: obligation
    @id: 176
    @loc: 395:42:395:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 177
    @loc: 395:48:395:51
    @status: to be proved

    @type: obligation
    @id: 177
    @loc: 395:48:395:51
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 178
    @loc: 397:9:397:11
    @status: to be proved

    @type: obligation
    @id: 178
    @loc: 397:9:397:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 179
    @loc: 397:12:397:16
    @status: to be proved

    @type: obligation
    @id: 179
    @loc: 397:12:397:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 180
    @loc: 397:18:397:22
    @status: to be proved

    @type: obligation
    @id: 180
    @loc: 397:18:397:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 181
    @loc: 864:9:864:11
    @status: to be proved

    @type: obligation
    @id: 181
    @loc: 864:9:864:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 182
    @loc: 864:12:864:16
    @status: to be proved

    @type: obligation
    @id: 182
    @loc: 864:12:864:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 183
    @loc: 864:18:864:22
    @status: to be proved

    @type: obligation
    @id: 183
    @loc: 864:18:864:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 184
    @loc: 864:24:864:28
    @status: to be proved

    @type: obligation
    @id: 184
    @loc: 864:24:864:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 185
    @loc: 864:30:864:34
    @status: to be proved

    @type: obligation
    @id: 185
    @loc: 864:30:864:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 186
    @loc: 436:11:436:13
    @status: to be proved

    @type: obligation
    @id: 186
    @loc: 436:11:436:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 187
    @loc: 436:14:436:18
    @status: to be proved

    @type: obligation
    @id: 187
    @loc: 436:14:436:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 188
    @loc: 436:20:436:24
    @status: to be proved

    @type: obligation
    @id: 188
    @loc: 436:20:436:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 189
    @loc: 405:11:405:13
    @status: to be proved

    @type: obligation
    @id: 189
    @loc: 405:11:405:13
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 190
    @loc: 405:14:405:18
    @status: to be proved

    @type: obligation
    @id: 190
    @loc: 405:14:405:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 191
    @loc: 405:20:405:24
    @status: to be proved

    @type: obligation
    @id: 191
    @loc: 405:20:405:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 192
    @loc: 405:26:405:30
    @status: to be proved

    @type: obligation
    @id: 192
    @loc: 405:26:405:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 193
    @loc: 405:32:405:36
    @status: to be proved

    @type: obligation
    @id: 193
    @loc: 405:32:405:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 194
    @loc: 405:38:405:40
    @status: to be proved

    @type: obligation
    @id: 194
    @loc: 405:38:405:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 195
    @loc: 434:13:434:15
    @status: to be proved

    @type: obligation
    @id: 195
    @loc: 434:13:434:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 196
    @loc: 434:16:434:20
    @status: to be proved

    @type: obligation
    @id: 196
    @loc: 434:16:434:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 197
    @loc: 434:22:434:26
    @status: to be proved

    @type: obligation
    @id: 197
    @loc: 434:22:434:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 198
    @loc: 434:28:434:32
    @status: to be proved

    @type: obligation
    @id: 198
    @loc: 434:28:434:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 199
    @loc: 434:34:434:38
    @status: to be proved

    @type: obligation
    @id: 199
    @loc: 434:34:434:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 200
    @loc: 416:13:416:20
    @status: to be proved

    @type: obligation
    @id: 200
    @loc: 416:13:416:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 201
    @loc: 422:21:422:28
    @status: to be proved

    @type: obligation
    @id: 201
    @loc: 422:21:422:28
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 202
    @loc: 419:15:419:17
    @status: to be proved

    @type: obligation
    @id: 202
    @loc: 419:15:419:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 203
    @loc: 419:18:419:22
    @status: to be proved

    @type: obligation
    @id: 203
    @loc: 419:18:419:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 204
    @loc: 419:24:419:28
    @status: to be proved

    @type: obligation
    @id: 204
    @loc: 419:24:419:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 205
    @loc: 419:30:419:34
    @status: to be proved

    @type: obligation
    @id: 205
    @loc: 419:30:419:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 206
    @loc: 419:36:419:40
    @status: to be proved

    @type: obligation
    @id: 206
    @loc: 419:36:419:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 207
    @loc: 421:15:421:17
    @status: to be proved

    @type: obligation
    @id: 207
    @loc: 421:15:421:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 208
    @loc: 421:18:421:22
    @status: to be proved

    @type: obligation
    @id: 208
    @loc: 421:18:421:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 209
    @loc: 421:24:421:28
    @status: to be proved

    @type: obligation
    @id: 209
    @loc: 421:24:421:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 210
    @loc: 421:30:421:34
    @status: to be proved

    @type: obligation
    @id: 210
    @loc: 421:30:421:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 211
    @loc: 421:36:421:40
    @status: to be proved

    @type: obligation
    @id: 211
    @loc: 421:36:421:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 212
    @loc: 424:13:424:15
    @status: to be proved

    @type: obligation
    @id: 212
    @loc: 424:13:424:15
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 213
    @loc: 424:16:424:20
    @status: to be proved

    @type: obligation
    @id: 213
    @loc: 424:16:424:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 214
    @loc: 424:22:424:26
    @status: to be proved

    @type: obligation
    @id: 214
    @loc: 424:22:424:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 215
    @loc: 424:28:424:32
    @status: to be proved

    @type: obligation
    @id: 215
    @loc: 424:28:424:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 216
    @loc: 424:34:424:38
    @status: to be proved

    @type: obligation
    @id: 216
    @loc: 424:34:424:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 217
    @loc: 424:40:424:42
    @status: to be proved

    @type: obligation
    @id: 217
    @loc: 424:40:424:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 218
    @loc: 430:21:430:28
    @status: to be proved

    @type: obligation
    @id: 218
    @loc: 430:21:430:28
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 219
    @loc: 427:15:427:17
    @status: to be proved

    @type: obligation
    @id: 219
    @loc: 427:15:427:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 220
    @loc: 427:18:427:22
    @status: to be proved

    @type: obligation
    @id: 220
    @loc: 427:18:427:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 221
    @loc: 427:24:427:28
    @status: to be proved

    @type: obligation
    @id: 221
    @loc: 427:24:427:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 222
    @loc: 427:30:427:34
    @status: to be proved

    @type: obligation
    @id: 222
    @loc: 427:30:427:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 223
    @loc: 427:36:427:40
    @status: to be proved

    @type: obligation
    @id: 223
    @loc: 427:36:427:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 224
    @loc: 429:15:429:17
    @status: to be proved

    @type: obligation
    @id: 224
    @loc: 429:15:429:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 225
    @loc: 429:18:429:22
    @status: to be proved

    @type: obligation
    @id: 225
    @loc: 429:18:429:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 226
    @loc: 429:24:429:28
    @status: to be proved

    @type: obligation
    @id: 226
    @loc: 429:24:429:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 227
    @loc: 429:30:429:34
    @status: to be proved

    @type: obligation
    @id: 227
    @loc: 429:30:429:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 228
    @loc: 429:36:429:40
    @status: to be proved

    @type: obligation
    @id: 228
    @loc: 429:36:429:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 229
    @loc: 429:42:429:60
    @status: to be proved

    @type: obligation
    @id: 229
    @loc: 429:42:429:60
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 230
    @loc: 429:62:429:88
    @status: to be proved

    @type: obligation
    @id: 230
    @loc: 429:62:429:88
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 231
    @loc: 432:13:432:15
    @status: to be proved

    @type: obligation
    @id: 231
    @loc: 432:13:432:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 232
    @loc: 432:16:432:20
    @status: to be proved

    @type: obligation
    @id: 232
    @loc: 432:16:432:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 233
    @loc: 432:22:432:26
    @status: to be proved

    @type: obligation
    @id: 233
    @loc: 432:22:432:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 234
    @loc: 432:28:432:32
    @status: to be proved

    @type: obligation
    @id: 234
    @loc: 432:28:432:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 235
    @loc: 432:34:432:38
    @status: to be proved

    @type: obligation
    @id: 235
    @loc: 432:34:432:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 236
    @loc: 755:11:755:13
    @status: to be proved

    @type: obligation
    @id: 236
    @loc: 755:11:755:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 237
    @loc: 755:14:755:18
    @status: to be proved

    @type: obligation
    @id: 237
    @loc: 755:14:755:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 238
    @loc: 755:20:755:24
    @status: to be proved

    @type: obligation
    @id: 238
    @loc: 755:20:755:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 239
    @loc: 755:26:755:30
    @status: to be proved

    @type: obligation
    @id: 239
    @loc: 755:26:755:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 240
    @loc: 445:11:445:13
    @status: to be proved

    @type: obligation
    @id: 240
    @loc: 445:11:445:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 241
    @loc: 447:11:447:13
    @status: to be proved

    @type: obligation
    @id: 241
    @loc: 447:11:447:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 242
    @loc: 447:14:447:18
    @status: to be proved

    @type: obligation
    @id: 242
    @loc: 447:14:447:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 243
    @loc: 454:11:454:13
    @status: to be proved

    @type: obligation
    @id: 243
    @loc: 454:11:454:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 244
    @loc: 454:14:454:18
    @status: to be proved

    @type: obligation
    @id: 244
    @loc: 454:14:454:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 245
    @loc: 454:31:454:41
    @status: to be proved

    @type: obligation
    @id: 245
    @loc: 454:31:454:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 246
    @loc: 454:43:454:55
    @status: to be proved

    @type: obligation
    @id: 246
    @loc: 454:43:454:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 247
    @loc: 454:57:454:65
    @status: to be proved

    @type: obligation
    @id: 247
    @loc: 454:57:454:65
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 248
    @loc: 454:67:454:70
    @status: to be proved

    @type: obligation
    @id: 248
    @loc: 454:67:454:70
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 249
    @loc: 464:11:464:13
    @status: to be proved

    @type: obligation
    @id: 249
    @loc: 464:11:464:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 250
    @loc: 464:15:464:19
    @status: to be proved

    @type: obligation
    @id: 250
    @loc: 464:15:464:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 251
    @loc: 464:32:464:42
    @status: to be proved

    @type: obligation
    @id: 251
    @loc: 464:32:464:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 252
    @loc: 464:44:464:56
    @status: to be proved

    @type: obligation
    @id: 252
    @loc: 464:44:464:56
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 253
    @loc: 464:58:464:66
    @status: to be proved

    @type: obligation
    @id: 253
    @loc: 464:58:464:66
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 254
    @loc: 464:68:464:71
    @status: to be proved

    @type: obligation
    @id: 254
    @loc: 464:68:464:71
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 255
    @loc: 594:13:594:15
    @status: to be proved

    @type: obligation
    @id: 255
    @loc: 594:13:594:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 256
    @loc: 594:16:594:20
    @status: to be proved

    @type: obligation
    @id: 256
    @loc: 594:16:594:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 257
    @loc: 594:22:594:26
    @status: to be proved

    @type: obligation
    @id: 257
    @loc: 594:22:594:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 258
    @loc: 488:15:488:17
    @status: to be proved

    @type: obligation
    @id: 258
    @loc: 488:15:488:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 259
    @loc: 488:18:488:22
    @status: to be proved

    @type: obligation
    @id: 259
    @loc: 488:18:488:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 260
    @loc: 488:24:488:32
    @status: to be proved

    @type: obligation
    @id: 260
    @loc: 488:24:488:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 261
    @loc: 478:15:478:17
    @status: to be proved

    @type: obligation
    @id: 261
    @loc: 478:15:478:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 263
    @loc: 480:16:480:18
    @status: to be proved

    @type: obligation
    @id: 263
    @loc: 480:16:480:18
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 264
    @loc: 482:15:482:17
    @status: to be proved

    @type: obligation
    @id: 264
    @loc: 482:15:482:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 265
    @loc: 482:18:482:22
    @status: to be proved

    @type: obligation
    @id: 265
    @loc: 482:18:482:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 266
    @loc: 482:24:482:28
    @status: to be proved

    @type: obligation
    @id: 266
    @loc: 482:24:482:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 267
    @loc: 482:41:482:44
    @status: to be proved

    @type: obligation
    @id: 267
    @loc: 482:41:482:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 268
    @loc: 484:15:484:17
    @status: to be proved

    @type: obligation
    @id: 268
    @loc: 484:15:484:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 269
    @loc: 484:18:484:22
    @status: to be proved

    @type: obligation
    @id: 269
    @loc: 484:18:484:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 270
    @loc: 484:24:484:27
    @status: to be proved

    @type: obligation
    @id: 270
    @loc: 484:24:484:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 271
    @loc: 486:15:486:17
    @status: to be proved

    @type: obligation
    @id: 271
    @loc: 486:15:486:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 272
    @loc: 486:18:486:22
    @status: to be proved

    @type: obligation
    @id: 272
    @loc: 486:18:486:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 273
    @loc: 486:24:486:34
    @status: to be proved

    @type: obligation
    @id: 273
    @loc: 486:24:486:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 274
    @loc: 486:36:486:48
    @status: to be proved

    @type: obligation
    @id: 274
    @loc: 486:36:486:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 275
    @loc: 496:14:496:16
    @status: to be proved

    @type: obligation
    @id: 275
    @loc: 496:14:496:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 276
    @loc: 496:18:496:22
    @status: to be proved

    @type: obligation
    @id: 276
    @loc: 496:18:496:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 277
    @loc: 496:24:496:28
    @status: to be proved

    @type: obligation
    @id: 277
    @loc: 496:24:496:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 278
    @loc: 492:17:492:19
    @status: to be proved

    @type: obligation
    @id: 278
    @loc: 492:17:492:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 279
    @loc: 492:20:492:23
    @status: to be proved

    @type: obligation
    @id: 279
    @loc: 492:20:492:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 280
    @loc: 492:25:492:37
    @status: to be proved

    @type: obligation
    @id: 280
    @loc: 492:25:492:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 281
    @loc: 494:15:494:17
    @status: to be proved

    @type: obligation
    @id: 281
    @loc: 494:15:494:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 282
    @loc: 504:15:504:17
    @status: to be proved

    @type: obligation
    @id: 282
    @loc: 504:15:504:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 283
    @loc: 504:18:504:22
    @status: to be proved

    @type: obligation
    @id: 283
    @loc: 504:18:504:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 284
    @loc: 504:24:504:28
    @status: to be proved

    @type: obligation
    @id: 284
    @loc: 504:24:504:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 285
    @loc: 504:30:504:34
    @status: to be proved

    @type: obligation
    @id: 285
    @loc: 504:30:504:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 286
    @loc: 504:36:504:39
    @status: to be proved

    @type: obligation
    @id: 286
    @loc: 504:36:504:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 287
    @loc: 500:15:500:17
    @status: to be proved

    @type: obligation
    @id: 287
    @loc: 500:15:500:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 288
    @loc: 500:19:500:25
    @status: to be proved

    @type: obligation
    @id: 288
    @loc: 500:19:500:25
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 289
    @loc: 500:28:500:32
    @status: to be proved

    @type: obligation
    @id: 289
    @loc: 500:28:500:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 290
    @loc: 500:34:500:68
    @status: to be proved

    @type: obligation
    @id: 290
    @loc: 500:34:500:68
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 291
    @loc: 502:15:502:17
    @status: to be proved

    @type: obligation
    @id: 291
    @loc: 502:15:502:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 292
    @loc: 502:19:502:23
    @status: to be proved

    @type: obligation
    @id: 292
    @loc: 502:19:502:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 293
    @loc: 502:36:502:40
    @status: to be proved

    @type: obligation
    @id: 293
    @loc: 502:36:502:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 294
    @loc: 502:51:502:54
    @status: to be proved

    @type: obligation
    @id: 294
    @loc: 502:51:502:54
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 295
    @loc: 518:15:518:17
    @status: to be proved

    @type: obligation
    @id: 295
    @loc: 518:15:518:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 296
    @loc: 518:18:518:22
    @status: to be proved

    @type: obligation
    @id: 296
    @loc: 518:18:518:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 297
    @loc: 518:24:518:32
    @status: to be proved

    @type: obligation
    @id: 297
    @loc: 518:24:518:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 298
    @loc: 508:15:508:17
    @status: to be proved

    @type: obligation
    @id: 298
    @loc: 508:15:508:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 300
    @loc: 510:16:510:18
    @status: to be proved

    @type: obligation
    @id: 300
    @loc: 510:16:510:18
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 301
    @loc: 512:15:512:17
    @status: to be proved

    @type: obligation
    @id: 301
    @loc: 512:15:512:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 302
    @loc: 512:18:512:22
    @status: to be proved

    @type: obligation
    @id: 302
    @loc: 512:18:512:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 303
    @loc: 512:24:512:28
    @status: to be proved

    @type: obligation
    @id: 303
    @loc: 512:24:512:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 304
    @loc: 512:41:512:44
    @status: to be proved

    @type: obligation
    @id: 304
    @loc: 512:41:512:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 305
    @loc: 514:15:514:17
    @status: to be proved

    @type: obligation
    @id: 305
    @loc: 514:15:514:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 306
    @loc: 514:18:514:22
    @status: to be proved

    @type: obligation
    @id: 306
    @loc: 514:18:514:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 307
    @loc: 514:24:514:27
    @status: to be proved

    @type: obligation
    @id: 307
    @loc: 514:24:514:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 308
    @loc: 516:15:516:17
    @status: to be proved

    @type: obligation
    @id: 308
    @loc: 516:15:516:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 309
    @loc: 516:18:516:22
    @status: to be proved

    @type: obligation
    @id: 309
    @loc: 516:18:516:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 310
    @loc: 516:24:516:34
    @status: to be proved

    @type: obligation
    @id: 310
    @loc: 516:24:516:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 311
    @loc: 516:36:516:48
    @status: to be proved

    @type: obligation
    @id: 311
    @loc: 516:36:516:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 312
    @loc: 523:15:523:17
    @status: to be proved

    @type: obligation
    @id: 312
    @loc: 523:15:523:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 313
    @loc: 523:18:523:22
    @status: to be proved

    @type: obligation
    @id: 313
    @loc: 523:18:523:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 314
    @loc: 523:24:523:28
    @status: to be proved

    @type: obligation
    @id: 314
    @loc: 523:24:523:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 315
    @loc: 521:15:521:17
    @status: to be proved

    @type: obligation
    @id: 315
    @loc: 521:15:521:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 316
    @loc: 521:18:521:22
    @status: to be proved

    @type: obligation
    @id: 316
    @loc: 521:18:521:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 317
    @loc: 521:24:521:28
    @status: to be proved

    @type: obligation
    @id: 317
    @loc: 521:24:521:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 318
    @loc: 521:30:521:34
    @status: to be proved

    @type: obligation
    @id: 318
    @loc: 521:30:521:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 319
    @loc: 521:36:521:39
    @status: to be proved

    @type: obligation
    @id: 319
    @loc: 521:36:521:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 320
    @loc: 592:17:592:19
    @status: to be proved

    @type: obligation
    @id: 320
    @loc: 592:17:592:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 321
    @loc: 592:20:592:24
    @status: to be proved

    @type: obligation
    @id: 321
    @loc: 592:20:592:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 322
    @loc: 592:26:592:30
    @status: to be proved

    @type: obligation
    @id: 322
    @loc: 592:26:592:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 323
    @loc: 592:32:592:36
    @status: to be proved

    @type: obligation
    @id: 323
    @loc: 592:32:592:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 324
    @loc: 588:19:588:21
    @status: to be proved

    @type: obligation
    @id: 324
    @loc: 588:19:588:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 325
    @loc: 588:22:588:26
    @status: to be proved

    @type: obligation
    @id: 325
    @loc: 588:22:588:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 326
    @loc: 588:28:588:32
    @status: to be proved

    @type: obligation
    @id: 326
    @loc: 588:28:588:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 327
    @loc: 588:34:588:38
    @status: to be proved

    @type: obligation
    @id: 327
    @loc: 588:34:588:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 328
    @loc: 588:40:588:43
    @status: to be proved

    @type: obligation
    @id: 328
    @loc: 588:40:588:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 329
    @loc: 580:21:580:23
    @status: to be proved

    @type: obligation
    @id: 329
    @loc: 580:21:580:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 330
    @loc: 580:24:580:28
    @status: to be proved

    @type: obligation
    @id: 330
    @loc: 580:24:580:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 331
    @loc: 582:19:582:21
    @status: to be proved

    @type: obligation
    @id: 331
    @loc: 582:19:582:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 332
    @loc: 582:22:582:26
    @status: to be proved

    @type: obligation
    @id: 332
    @loc: 582:22:582:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 333
    @loc: 582:28:582:32
    @status: to be proved

    @type: obligation
    @id: 333
    @loc: 582:28:582:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 334
    @loc: 582:45:582:55
    @status: to be proved

    @type: obligation
    @id: 334
    @loc: 582:45:582:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 335
    @loc: 582:57:582:69
    @status: to be proved

    @type: obligation
    @id: 335
    @loc: 582:57:582:69
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 336
    @loc: 582:71:582:79
    @status: to be proved

    @type: obligation
    @id: 336
    @loc: 582:71:582:79
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 337
    @loc: 584:19:584:21
    @status: to be proved

    @type: obligation
    @id: 337
    @loc: 584:19:584:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 338
    @loc: 584:22:584:32
    @status: to be proved

    @type: obligation
    @id: 338
    @loc: 584:22:584:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 339
    @loc: 584:34:584:46
    @status: to be proved

    @type: obligation
    @id: 339
    @loc: 584:34:584:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 340
    @loc: 584:48:584:56
    @status: to be proved

    @type: obligation
    @id: 340
    @loc: 584:48:584:56
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 341
    @loc: 586:19:586:21
    @status: to be proved

    @type: obligation
    @id: 341
    @loc: 586:19:586:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 342
    @loc: 586:22:586:26
    @status: to be proved

    @type: obligation
    @id: 342
    @loc: 586:22:586:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 343
    @loc: 586:28:586:32
    @status: to be proved

    @type: obligation
    @id: 343
    @loc: 586:28:586:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 344
    @loc: 586:34:586:52
    @status: to be proved

    @type: obligation
    @id: 344
    @loc: 586:34:586:52
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 345
    @loc: 586:54:586:57
    @status: to be proved

    @type: obligation
    @id: 345
    @loc: 586:54:586:57
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 346
    @loc: 590:17:590:19
    @status: to be proved

    @type: obligation
    @id: 346
    @loc: 590:17:590:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 347
    @loc: 590:20:590:24
    @status: to be proved

    @type: obligation
    @id: 347
    @loc: 590:20:590:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 348
    @loc: 590:26:590:30
    @status: to be proved

    @type: obligation
    @id: 348
    @loc: 590:26:590:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 349
    @loc: 590:32:590:36
    @status: to be proved

    @type: obligation
    @id: 349
    @loc: 590:32:590:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 350
    @loc: 590:38:590:41
    @status: to be proved

    @type: obligation
    @id: 350
    @loc: 590:38:590:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 351
    @loc: 548:17:548:19
    @status: to be proved

    @type: obligation
    @id: 351
    @loc: 548:17:548:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 352
    @loc: 548:20:548:24
    @status: to be proved

    @type: obligation
    @id: 352
    @loc: 548:20:548:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 353
    @loc: 548:26:548:30
    @status: to be proved

    @type: obligation
    @id: 353
    @loc: 548:26:548:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 354
    @loc: 548:32:548:35
    @status: to be proved

    @type: obligation
    @id: 354
    @loc: 548:32:548:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 355
    @loc: 528:17:528:19
    @status: to be proved

    @type: obligation
    @id: 355
    @loc: 528:17:528:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 356
    @loc: 528:20:528:24
    @status: to be proved

    @type: obligation
    @id: 356
    @loc: 528:20:528:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 357
    @loc: 530:17:530:19
    @status: to be proved

    @type: obligation
    @id: 357
    @loc: 530:17:530:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 359
    @loc: 532:17:532:19
    @status: to be proved

    @type: obligation
    @id: 359
    @loc: 532:17:532:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 360
    @loc: 532:20:532:32
    @status: to be proved

    @type: obligation
    @id: 360
    @loc: 532:20:532:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 361
    @loc: 532:34:532:37
    @status: to be proved

    @type: obligation
    @id: 361
    @loc: 532:34:532:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 362
    @loc: 534:17:534:19
    @status: to be proved

    @type: obligation
    @id: 362
    @loc: 534:17:534:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 363
    @loc: 534:20:534:24
    @status: to be proved

    @type: obligation
    @id: 363
    @loc: 534:20:534:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 364
    @loc: 534:26:534:30
    @status: to be proved

    @type: obligation
    @id: 364
    @loc: 534:26:534:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 365
    @loc: 534:32:534:35
    @status: to be proved

    @type: obligation
    @id: 365
    @loc: 534:32:534:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 366
    @loc: 546:19:546:21
    @status: to be proved

    @type: obligation
    @id: 366
    @loc: 546:19:546:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 367
    @loc: 546:22:546:26
    @status: to be proved

    @type: obligation
    @id: 367
    @loc: 546:22:546:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 368
    @loc: 546:28:546:31
    @status: to be proved

    @type: obligation
    @id: 368
    @loc: 546:28:546:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 369
    @loc: 544:21:544:23
    @status: to be proved

    @type: obligation
    @id: 369
    @loc: 544:21:544:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 370
    @loc: 544:24:544:28
    @status: to be proved

    @type: obligation
    @id: 370
    @loc: 544:24:544:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 371
    @loc: 544:30:544:35
    @status: to be proved

    @type: obligation
    @id: 371
    @loc: 544:30:544:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 372
    @loc: 544:37:544:40
    @status: to be proved

    @type: obligation
    @id: 372
    @loc: 544:37:544:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 373
    @loc: 541:21:541:23
    @status: to be proved

    @type: obligation
    @id: 373
    @loc: 541:21:541:23
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 374
    @loc: 541:24:541:28
    @status: to be proved

    @type: obligation
    @id: 374
    @loc: 541:24:541:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 375
    @loc: 541:30:541:34
    @status: to be proved

    @type: obligation
    @id: 375
    @loc: 541:30:541:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 376
    @loc: 541:36:541:50
    @status: to be proved

    @type: obligation
    @id: 376
    @loc: 541:36:541:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 377
    @loc: 541:52:541:54
    @status: to be proved

    @type: obligation
    @id: 377
    @loc: 541:52:541:54
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 379
    @loc: 550:15:550:17
    @status: to be proved

    @type: obligation
    @id: 379
    @loc: 550:15:550:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 380
    @loc: 550:18:550:22
    @status: to be proved

    @type: obligation
    @id: 380
    @loc: 550:18:550:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 381
    @loc: 550:24:550:27
    @status: to be proved

    @type: obligation
    @id: 381
    @loc: 550:24:550:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 382
    @loc: 553:15:553:17
    @status: to be proved

    @type: obligation
    @id: 382
    @loc: 553:15:553:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 383
    @loc: 553:18:553:22
    @status: to be proved

    @type: obligation
    @id: 383
    @loc: 553:18:553:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 384
    @loc: 553:24:553:28
    @status: to be proved

    @type: obligation
    @id: 384
    @loc: 553:24:553:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 385
    @loc: 573:18:573:20
    @status: to be proved

    @type: obligation
    @id: 385
    @loc: 573:18:573:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 386
    @loc: 573:21:573:25
    @status: to be proved

    @type: obligation
    @id: 386
    @loc: 573:21:573:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 387
    @loc: 573:27:573:31
    @status: to be proved

    @type: obligation
    @id: 387
    @loc: 573:27:573:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 388
    @loc: 573:33:573:37
    @status: to be proved

    @type: obligation
    @id: 388
    @loc: 573:33:573:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 389
    @loc: 568:17:568:19
    @status: to be proved

    @type: obligation
    @id: 389
    @loc: 568:17:568:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 390
    @loc: 568:20:568:24
    @status: to be proved

    @type: obligation
    @id: 390
    @loc: 568:20:568:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 391
    @loc: 568:26:568:30
    @status: to be proved

    @type: obligation
    @id: 391
    @loc: 568:26:568:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 392
    @loc: 568:32:568:36
    @status: to be proved

    @type: obligation
    @id: 392
    @loc: 568:32:568:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 393
    @loc: 568:38:568:42
    @status: to be proved

    @type: obligation
    @id: 393
    @loc: 568:38:568:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 394
    @loc: 568:44:568:47
    @status: to be proved

    @type: obligation
    @id: 394
    @loc: 568:44:568:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 395
    @loc: 558:19:558:21
    @status: to be proved

    @type: obligation
    @id: 395
    @loc: 558:19:558:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 396
    @loc: 558:22:558:32
    @status: to be proved

    @type: obligation
    @id: 396
    @loc: 558:22:558:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 397
    @loc: 558:34:558:46
    @status: to be proved

    @type: obligation
    @id: 397
    @loc: 558:34:558:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 398
    @loc: 558:48:558:51
    @status: to be proved

    @type: obligation
    @id: 398
    @loc: 558:48:558:51
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 399
    @loc: 560:19:560:21
    @status: to be proved

    @type: obligation
    @id: 399
    @loc: 560:19:560:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 400
    @loc: 560:22:560:26
    @status: to be proved

    @type: obligation
    @id: 400
    @loc: 560:22:560:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 401
    @loc: 560:28:560:32
    @status: to be proved

    @type: obligation
    @id: 401
    @loc: 560:28:560:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 402
    @loc: 560:34:560:38
    @status: to be proved

    @type: obligation
    @id: 402
    @loc: 560:34:560:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 403
    @loc: 560:40:560:58
    @status: to be proved

    @type: obligation
    @id: 403
    @loc: 560:40:560:58
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 404
    @loc: 562:19:562:21
    @status: to be proved

    @type: obligation
    @id: 404
    @loc: 562:19:562:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 405
    @loc: 562:22:562:26
    @status: to be proved

    @type: obligation
    @id: 405
    @loc: 562:22:562:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 406
    @loc: 562:28:562:36
    @status: to be proved

    @type: obligation
    @id: 406
    @loc: 562:28:562:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 407
    @loc: 564:19:564:21
    @status: to be proved

    @type: obligation
    @id: 407
    @loc: 564:19:564:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 408
    @loc: 564:22:564:26
    @status: to be proved

    @type: obligation
    @id: 408
    @loc: 564:22:564:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 409
    @loc: 564:28:564:32
    @status: to be proved

    @type: obligation
    @id: 409
    @loc: 564:28:564:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 410
    @loc: 564:34:564:42
    @status: to be proved

    @type: obligation
    @id: 410
    @loc: 564:34:564:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 411
    @loc: 566:19:566:21
    @status: to be proved

    @type: obligation
    @id: 411
    @loc: 566:19:566:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 412
    @loc: 566:22:566:26
    @status: to be proved

    @type: obligation
    @id: 412
    @loc: 566:22:566:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 413
    @loc: 566:28:566:32
    @status: to be proved

    @type: obligation
    @id: 413
    @loc: 566:28:566:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 414
    @loc: 570:17:570:19
    @status: to be proved

    @type: obligation
    @id: 414
    @loc: 570:17:570:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 415
    @loc: 570:20:570:24
    @status: to be proved

    @type: obligation
    @id: 415
    @loc: 570:20:570:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 416
    @loc: 570:26:570:30
    @status: to be proved

    @type: obligation
    @id: 416
    @loc: 570:26:570:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 417
    @loc: 570:32:570:36
    @status: to be proved

    @type: obligation
    @id: 417
    @loc: 570:32:570:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 418
    @loc: 570:38:570:42
    @status: to be proved

    @type: obligation
    @id: 418
    @loc: 570:38:570:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 419
    @loc: 570:44:570:48
    @status: to be proved

    @type: obligation
    @id: 419
    @loc: 570:44:570:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 420
    @loc: 570:50:570:54
    @status: to be proved

    @type: obligation
    @id: 420
    @loc: 570:50:570:54
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 421
    @loc: 570:56:570:64
    @status: to be proved

    @type: obligation
    @id: 421
    @loc: 570:56:570:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 422
    @loc: 571:18:571:28
    @status: to be proved

    @type: obligation
    @id: 422
    @loc: 571:18:571:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 423
    @loc: 571:30:571:42
    @status: to be proved

    @type: obligation
    @id: 423
    @loc: 571:30:571:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 424
    @loc: 571:44:571:62
    @status: to be proved

    @type: obligation
    @id: 424
    @loc: 571:44:571:62
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 425
    @loc: 571:64:571:67
    @status: to be proved

    @type: obligation
    @id: 425
    @loc: 571:64:571:67
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 426
    @loc: 575:15:575:17
    @status: to be proved

    @type: obligation
    @id: 426
    @loc: 575:15:575:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 427
    @loc: 575:18:575:22
    @status: to be proved

    @type: obligation
    @id: 427
    @loc: 575:18:575:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 428
    @loc: 575:24:575:28
    @status: to be proved

    @type: obligation
    @id: 428
    @loc: 575:24:575:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 429
    @loc: 753:13:753:15
    @status: to be proved

    @type: obligation
    @id: 429
    @loc: 753:13:753:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 430
    @loc: 753:16:753:20
    @status: to be proved

    @type: obligation
    @id: 430
    @loc: 753:16:753:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 431
    @loc: 753:22:753:26
    @status: to be proved

    @type: obligation
    @id: 431
    @loc: 753:22:753:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 432
    @loc: 639:17:639:19
    @status: to be proved

    @type: obligation
    @id: 432
    @loc: 639:17:639:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 433
    @loc: 639:20:639:24
    @status: to be proved

    @type: obligation
    @id: 433
    @loc: 639:20:639:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 434
    @loc: 639:26:639:30
    @status: to be proved

    @type: obligation
    @id: 434
    @loc: 639:26:639:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 435
    @loc: 633:19:633:21
    @status: to be proved

    @type: obligation
    @id: 435
    @loc: 633:19:633:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 436
    @loc: 633:22:633:26
    @status: to be proved

    @type: obligation
    @id: 436
    @loc: 633:22:633:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 437
    @loc: 631:19:631:21
    @status: to be proved

    @type: obligation
    @id: 437
    @loc: 631:19:631:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 438
    @loc: 635:17:635:19
    @status: to be proved

    @type: obligation
    @id: 438
    @loc: 635:17:635:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 439
    @loc: 635:20:635:24
    @status: to be proved

    @type: obligation
    @id: 439
    @loc: 635:20:635:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 440
    @loc: 635:26:635:30
    @status: to be proved

    @type: obligation
    @id: 440
    @loc: 635:26:635:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 441
    @loc: 637:17:637:19
    @status: to be proved

    @type: obligation
    @id: 441
    @loc: 637:17:637:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 442
    @loc: 637:20:637:24
    @status: to be proved

    @type: obligation
    @id: 442
    @loc: 637:20:637:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 443
    @loc: 637:26:637:30
    @status: to be proved

    @type: obligation
    @id: 443
    @loc: 637:26:637:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 444
    @loc: 607:15:607:17
    @status: to be proved

    @type: obligation
    @id: 444
    @loc: 607:15:607:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 445
    @loc: 607:18:607:22
    @status: to be proved

    @type: obligation
    @id: 445
    @loc: 607:18:607:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 446
    @loc: 607:24:607:27
    @status: to be proved

    @type: obligation
    @id: 446
    @loc: 607:24:607:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 447
    @loc: 609:15:609:17
    @status: to be proved

    @type: obligation
    @id: 447
    @loc: 609:15:609:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 448
    @loc: 609:18:609:22
    @status: to be proved

    @type: obligation
    @id: 448
    @loc: 609:18:609:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 449
    @loc: 609:24:609:27
    @status: to be proved

    @type: obligation
    @id: 449
    @loc: 609:24:609:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 450
    @loc: 621:17:621:19
    @status: to be proved

    @type: obligation
    @id: 450
    @loc: 621:17:621:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 451
    @loc: 621:20:621:24
    @status: to be proved

    @type: obligation
    @id: 451
    @loc: 621:20:621:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 452
    @loc: 621:26:621:30
    @status: to be proved

    @type: obligation
    @id: 452
    @loc: 621:26:621:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 453
    @loc: 621:32:621:36
    @status: to be proved

    @type: obligation
    @id: 453
    @loc: 621:32:621:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 454
    @loc: 621:38:621:41
    @status: to be proved

    @type: obligation
    @id: 454
    @loc: 621:38:621:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 455
    @loc: 613:23:613:27
    @status: to be proved

    @type: obligation
    @id: 455
    @loc: 613:23:613:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 456
    @loc: 615:17:615:19
    @status: to be proved

    @type: obligation
    @id: 456
    @loc: 615:17:615:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 457
    @loc: 615:20:615:32
    @status: to be proved

    @type: obligation
    @id: 457
    @loc: 615:20:615:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 458
    @loc: 615:34:615:37
    @status: to be proved

    @type: obligation
    @id: 458
    @loc: 615:34:615:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 459
    @loc: 617:17:617:19
    @status: to be proved

    @type: obligation
    @id: 459
    @loc: 617:17:617:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 460
    @loc: 617:20:617:24
    @status: to be proved

    @type: obligation
    @id: 460
    @loc: 617:20:617:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 461
    @loc: 617:26:617:30
    @status: to be proved

    @type: obligation
    @id: 461
    @loc: 617:26:617:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 462
    @loc: 617:32:617:35
    @status: to be proved

    @type: obligation
    @id: 462
    @loc: 617:32:617:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 463
    @loc: 619:17:619:19
    @status: to be proved

    @type: obligation
    @id: 463
    @loc: 619:17:619:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 464
    @loc: 619:20:619:23
    @status: to be proved

    @type: obligation
    @id: 464
    @loc: 619:20:619:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 465
    @loc: 623:15:623:17
    @status: to be proved

    @type: obligation
    @id: 465
    @loc: 623:15:623:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 466
    @loc: 623:18:623:22
    @status: to be proved

    @type: obligation
    @id: 466
    @loc: 623:18:623:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 467
    @loc: 655:15:655:17
    @status: to be proved

    @type: obligation
    @id: 467
    @loc: 655:15:655:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 468
    @loc: 655:18:655:22
    @status: to be proved

    @type: obligation
    @id: 468
    @loc: 655:18:655:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 469
    @loc: 655:24:655:27
    @status: to be proved

    @type: obligation
    @id: 469
    @loc: 655:24:655:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 470
    @loc: 644:17:644:24
    @status: to be proved

    @type: obligation
    @id: 470
    @loc: 644:17:644:24
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 471
    @loc: 647:15:647:22
    @status: to be proved

    @type: obligation
    @id: 471
    @loc: 647:15:647:22
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 472
    @loc: 649:15:649:17
    @status: to be proved

    @type: obligation
    @id: 472
    @loc: 649:15:649:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 473
    @loc: 649:18:649:22
    @status: to be proved

    @type: obligation
    @id: 473
    @loc: 649:18:649:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 474
    @loc: 649:24:649:46
    @status: to be proved

    @type: obligation
    @id: 474
    @loc: 649:24:649:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 475
    @loc: 649:48:649:51
    @status: to be proved

    @type: obligation
    @id: 475
    @loc: 649:48:649:51
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 476
    @loc: 651:15:651:17
    @status: to be proved

    @type: obligation
    @id: 476
    @loc: 651:15:651:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 477
    @loc: 651:18:651:22
    @status: to be proved

    @type: obligation
    @id: 477
    @loc: 651:18:651:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 478
    @loc: 651:24:651:27
    @status: to be proved

    @type: obligation
    @id: 478
    @loc: 651:24:651:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 479
    @loc: 653:15:653:17
    @status: to be proved

    @type: obligation
    @id: 479
    @loc: 653:15:653:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 480
    @loc: 653:18:653:22
    @status: to be proved

    @type: obligation
    @id: 480
    @loc: 653:18:653:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 481
    @loc: 653:24:653:27
    @status: to be proved

    @type: obligation
    @id: 481
    @loc: 653:24:653:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 482
    @loc: 675:15:675:17
    @status: to be proved

    @type: obligation
    @id: 482
    @loc: 675:15:675:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 483
    @loc: 675:18:675:22
    @status: to be proved

    @type: obligation
    @id: 483
    @loc: 675:18:675:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 484
    @loc: 675:24:675:28
    @status: to be proved

    @type: obligation
    @id: 484
    @loc: 675:24:675:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 485
    @loc: 675:30:675:34
    @status: to be proved

    @type: obligation
    @id: 485
    @loc: 675:30:675:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 486
    @loc: 665:18:665:25
    @status: to be proved

    @type: obligation
    @id: 486
    @loc: 665:18:665:25
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 487
    @loc: 663:18:663:20
    @status: to be proved

    @type: obligation
    @id: 487
    @loc: 663:18:663:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 488
    @loc: 663:21:663:25
    @status: to be proved

    @type: obligation
    @id: 488
    @loc: 663:21:663:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 489
    @loc: 663:27:663:30
    @status: to be proved

    @type: obligation
    @id: 489
    @loc: 663:27:663:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 490
    @loc: 667:15:667:17
    @status: to be proved

    @type: obligation
    @id: 490
    @loc: 667:15:667:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 491
    @loc: 667:18:667:22
    @status: to be proved

    @type: obligation
    @id: 491
    @loc: 667:18:667:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 492
    @loc: 667:24:667:28
    @status: to be proved

    @type: obligation
    @id: 492
    @loc: 667:24:667:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 493
    @loc: 667:39:667:61
    @status: to be proved

    @type: obligation
    @id: 493
    @loc: 667:39:667:61
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 494
    @loc: 667:63:667:66
    @status: to be proved

    @type: obligation
    @id: 494
    @loc: 667:63:667:66
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 495
    @loc: 669:15:669:17
    @status: to be proved

    @type: obligation
    @id: 495
    @loc: 669:15:669:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 496
    @loc: 669:18:669:22
    @status: to be proved

    @type: obligation
    @id: 496
    @loc: 669:18:669:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 497
    @loc: 669:24:669:28
    @status: to be proved

    @type: obligation
    @id: 497
    @loc: 669:24:669:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 498
    @loc: 669:30:669:34
    @status: to be proved

    @type: obligation
    @id: 498
    @loc: 669:30:669:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 499
    @loc: 669:36:669:39
    @status: to be proved

    @type: obligation
    @id: 499
    @loc: 669:36:669:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 500
    @loc: 671:15:671:17
    @status: to be proved

    @type: obligation
    @id: 500
    @loc: 671:15:671:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 501
    @loc: 671:18:671:22
    @status: to be proved

    @type: obligation
    @id: 501
    @loc: 671:18:671:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 502
    @loc: 673:15:673:17
    @status: to be proved

    @type: obligation
    @id: 502
    @loc: 673:15:673:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 503
    @loc: 673:18:673:22
    @status: to be proved

    @type: obligation
    @id: 503
    @loc: 673:18:673:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 504
    @loc: 673:24:673:28
    @status: to be proved

    @type: obligation
    @id: 504
    @loc: 673:24:673:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 505
    @loc: 686:15:686:17
    @status: to be proved

    @type: obligation
    @id: 505
    @loc: 686:15:686:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 506
    @loc: 686:18:686:22
    @status: to be proved

    @type: obligation
    @id: 506
    @loc: 686:18:686:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 507
    @loc: 686:24:686:28
    @status: to be proved

    @type: obligation
    @id: 507
    @loc: 686:24:686:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 508
    @loc: 686:30:686:34
    @status: to be proved

    @type: obligation
    @id: 508
    @loc: 686:30:686:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 509
    @loc: 678:15:678:17
    @status: to be proved

    @type: obligation
    @id: 509
    @loc: 678:15:678:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 510
    @loc: 678:18:678:22
    @status: to be proved

    @type: obligation
    @id: 510
    @loc: 678:18:678:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 512
    @loc: 680:15:680:17
    @status: to be proved

    @type: obligation
    @id: 512
    @loc: 680:15:680:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 513
    @loc: 680:18:680:22
    @status: to be proved

    @type: obligation
    @id: 513
    @loc: 680:18:680:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 514
    @loc: 680:24:680:27
    @status: to be proved

    @type: obligation
    @id: 514
    @loc: 680:24:680:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 515
    @loc: 682:15:682:17
    @status: to be proved

    @type: obligation
    @id: 515
    @loc: 682:15:682:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 516
    @loc: 682:18:682:22
    @status: to be proved

    @type: obligation
    @id: 516
    @loc: 682:18:682:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 517
    @loc: 682:24:682:28
    @status: to be proved

    @type: obligation
    @id: 517
    @loc: 682:24:682:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 518
    @loc: 684:15:684:17
    @status: to be proved

    @type: obligation
    @id: 518
    @loc: 684:15:684:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 519
    @loc: 684:18:684:22
    @status: to be proved

    @type: obligation
    @id: 519
    @loc: 684:18:684:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 520
    @loc: 684:24:684:27
    @status: to be proved

    @type: obligation
    @id: 520
    @loc: 684:24:684:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 521
    @loc: 751:17:751:19
    @status: to be proved

    @type: obligation
    @id: 521
    @loc: 751:17:751:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 522
    @loc: 751:20:751:24
    @status: to be proved

    @type: obligation
    @id: 522
    @loc: 751:20:751:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 523
    @loc: 751:26:751:30
    @status: to be proved

    @type: obligation
    @id: 523
    @loc: 751:26:751:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 524
    @loc: 751:32:751:36
    @status: to be proved

    @type: obligation
    @id: 524
    @loc: 751:32:751:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 525
    @loc: 751:38:751:42
    @status: to be proved

    @type: obligation
    @id: 525
    @loc: 751:38:751:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 526
    @loc: 751:44:751:47
    @status: to be proved

    @type: obligation
    @id: 526
    @loc: 751:44:751:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 527
    @loc: 749:17:749:19
    @status: to be proved

    @type: obligation
    @id: 527
    @loc: 749:17:749:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 528
    @loc: 749:20:749:24
    @status: to be proved

    @type: obligation
    @id: 528
    @loc: 749:20:749:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 529
    @loc: 749:26:749:29
    @status: to be proved

    @type: obligation
    @id: 529
    @loc: 749:26:749:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 530
    @loc: 689:15:689:17
    @status: to be proved

    @type: obligation
    @id: 530
    @loc: 689:15:689:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 531
    @loc: 689:18:689:22
    @status: to be proved

    @type: obligation
    @id: 531
    @loc: 689:18:689:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 533
    @loc: 692:15:692:17
    @status: to be proved

    @type: obligation
    @id: 533
    @loc: 692:15:692:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 534
    @loc: 692:18:692:22
    @status: to be proved

    @type: obligation
    @id: 534
    @loc: 692:18:692:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 535
    @loc: 692:24:692:27
    @status: to be proved

    @type: obligation
    @id: 535
    @loc: 692:24:692:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 536
    @loc: 695:15:695:17
    @status: to be proved

    @type: obligation
    @id: 536
    @loc: 695:15:695:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 537
    @loc: 695:18:695:22
    @status: to be proved

    @type: obligation
    @id: 537
    @loc: 695:18:695:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 538
    @loc: 695:24:695:36
    @status: to be proved

    @type: obligation
    @id: 538
    @loc: 695:24:695:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 539
    @loc: 695:38:695:41
    @status: to be proved

    @type: obligation
    @id: 539
    @loc: 695:38:695:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 540
    @loc: 697:15:697:17
    @status: to be proved

    @type: obligation
    @id: 540
    @loc: 697:15:697:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 541
    @loc: 697:18:697:22
    @status: to be proved

    @type: obligation
    @id: 541
    @loc: 697:18:697:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 542
    @loc: 697:24:697:28
    @status: to be proved

    @type: obligation
    @id: 542
    @loc: 697:24:697:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 543
    @loc: 697:30:697:33
    @status: to be proved

    @type: obligation
    @id: 543
    @loc: 697:30:697:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 544
    @loc: 699:15:699:17
    @status: to be proved

    @type: obligation
    @id: 544
    @loc: 699:15:699:17
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 545
    @loc: 699:18:699:22
    @status: to be proved

    @type: obligation
    @id: 545
    @loc: 699:18:699:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 546
    @loc: 699:24:699:28
    @status: to be proved

    @type: obligation
    @id: 546
    @loc: 699:24:699:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 547
    @loc: 699:30:699:32
    @status: to be proved

    @type: obligation
    @id: 547
    @loc: 699:30:699:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 548
    @loc: 716:17:716:19
    @status: to be proved

    @type: obligation
    @id: 548
    @loc: 716:17:716:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 549
    @loc: 716:20:716:24
    @status: to be proved

    @type: obligation
    @id: 549
    @loc: 716:20:716:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 550
    @loc: 716:26:716:34
    @status: to be proved

    @type: obligation
    @id: 550
    @loc: 716:26:716:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 551
    @loc: 703:18:703:20
    @status: to be proved

    @type: obligation
    @id: 551
    @loc: 703:18:703:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 552
    @loc: 705:17:705:19
    @status: to be proved

    @type: obligation
    @id: 552
    @loc: 705:17:705:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 553
    @loc: 705:20:705:24
    @status: to be proved

    @type: obligation
    @id: 553
    @loc: 705:20:705:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 554
    @loc: 705:26:705:30
    @status: to be proved

    @type: obligation
    @id: 554
    @loc: 705:26:705:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 555
    @loc: 705:43:705:46
    @status: to be proved

    @type: obligation
    @id: 555
    @loc: 705:43:705:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 556
    @loc: 712:17:712:19
    @status: to be proved

    @type: obligation
    @id: 556
    @loc: 712:17:712:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 557
    @loc: 712:20:712:24
    @status: to be proved

    @type: obligation
    @id: 557
    @loc: 712:20:712:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 558
    @loc: 712:26:712:29
    @status: to be proved

    @type: obligation
    @id: 558
    @loc: 712:26:712:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 559
    @loc: 708:19:708:26
    @status: to be proved

    @type: obligation
    @id: 559
    @loc: 708:19:708:26
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 560
    @loc: 710:19:710:21
    @status: to be proved

    @type: obligation
    @id: 560
    @loc: 710:19:710:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 561
    @loc: 710:22:710:25
    @status: to be proved

    @type: obligation
    @id: 561
    @loc: 710:22:710:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 562
    @loc: 714:17:714:19
    @status: to be proved

    @type: obligation
    @id: 562
    @loc: 714:17:714:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 563
    @loc: 714:20:714:24
    @status: to be proved

    @type: obligation
    @id: 563
    @loc: 714:20:714:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 564
    @loc: 714:26:714:36
    @status: to be proved

    @type: obligation
    @id: 564
    @loc: 714:26:714:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 565
    @loc: 714:38:714:50
    @status: to be proved

    @type: obligation
    @id: 565
    @loc: 714:38:714:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 566
    @loc: 746:17:746:19
    @status: to be proved

    @type: obligation
    @id: 566
    @loc: 746:17:746:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 567
    @loc: 746:20:746:24
    @status: to be proved

    @type: obligation
    @id: 567
    @loc: 746:20:746:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 568
    @loc: 746:26:746:30
    @status: to be proved

    @type: obligation
    @id: 568
    @loc: 746:26:746:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 569
    @loc: 746:32:746:36
    @status: to be proved

    @type: obligation
    @id: 569
    @loc: 746:32:746:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 570
    @loc: 746:38:746:41
    @status: to be proved

    @type: obligation
    @id: 570
    @loc: 746:38:746:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 571
    @loc: 724:17:724:24
    @status: to be proved

    @type: obligation
    @id: 571
    @loc: 724:17:724:24
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 572
    @loc: 729:17:729:19
    @status: to be proved

    @type: obligation
    @id: 572
    @loc: 729:17:729:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 573
    @loc: 729:20:729:24
    @status: to be proved

    @type: obligation
    @id: 573
    @loc: 729:20:729:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 574
    @loc: 729:26:729:45
    @status: to be proved

    @type: obligation
    @id: 574
    @loc: 729:26:729:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 575
    @loc: 729:47:729:61
    @status: to be proved

    @type: obligation
    @id: 575
    @loc: 729:47:729:61
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 576
    @loc: 729:63:729:66
    @status: to be proved

    @type: obligation
    @id: 576
    @loc: 729:63:729:66
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 577
    @loc: 733:17:733:19
    @status: to be proved

    @type: obligation
    @id: 577
    @loc: 733:17:733:19
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 578
    @loc: 733:20:733:24
    @status: to be proved

    @type: obligation
    @id: 578
    @loc: 733:20:733:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 579
    @loc: 733:26:733:30
    @status: to be proved

    @type: obligation
    @id: 579
    @loc: 733:26:733:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 580
    @loc: 733:32:733:44
    @status: to be proved

    @type: obligation
    @id: 580
    @loc: 733:32:733:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 581
    @loc: 733:46:733:48
    @status: to be proved

    @type: obligation
    @id: 581
    @loc: 733:46:733:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 582
    @loc: 735:17:735:19
    @status: to be proved

    @type: obligation
    @id: 582
    @loc: 735:17:735:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 583
    @loc: 735:20:735:24
    @status: to be proved

    @type: obligation
    @id: 583
    @loc: 735:20:735:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 584
    @loc: 735:26:735:29
    @status: to be proved

    @type: obligation
    @id: 584
    @loc: 735:26:735:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 585
    @loc: 737:17:737:19
    @status: to be proved

    @type: obligation
    @id: 585
    @loc: 737:17:737:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 586
    @loc: 737:20:737:24
    @status: to be proved

    @type: obligation
    @id: 586
    @loc: 737:20:737:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 587
    @loc: 737:26:737:29
    @status: to be proved

    @type: obligation
    @id: 587
    @loc: 737:26:737:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 588
    @loc: 740:17:740:19
    @status: to be proved

    @type: obligation
    @id: 588
    @loc: 740:17:740:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 589
    @loc: 740:20:740:24
    @status: to be proved

    @type: obligation
    @id: 589
    @loc: 740:20:740:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 590
    @loc: 740:26:740:30
    @status: to be proved

    @type: obligation
    @id: 590
    @loc: 740:26:740:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 591
    @loc: 740:32:740:36
    @status: to be proved

    @type: obligation
    @id: 591
    @loc: 740:32:740:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 592
    @loc: 740:38:740:42
    @status: to be proved

    @type: obligation
    @id: 592
    @loc: 740:38:740:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 593
    @loc: 740:44:740:64
    @status: to be proved

    @type: obligation
    @id: 593
    @loc: 740:44:740:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 594
    @loc: 744:17:744:19
    @status: to be proved

    @type: obligation
    @id: 594
    @loc: 744:17:744:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 595
    @loc: 744:20:744:24
    @status: to be proved

    @type: obligation
    @id: 595
    @loc: 744:20:744:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 596
    @loc: 744:26:744:34
    @status: to be proved

    @type: obligation
    @id: 596
    @loc: 744:26:744:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 597
    @loc: 744:36:744:54
    @status: to be proved

    @type: obligation
    @id: 597
    @loc: 744:36:744:54
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 598
    @loc: 744:56:744:59
    @status: to be proved

    @type: obligation
    @id: 598
    @loc: 744:56:744:59
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 599
    @loc: 862:9:862:11
    @status: to be proved

    @type: obligation
    @id: 599
    @loc: 862:9:862:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 600
    @loc: 862:12:862:16
    @status: to be proved

    @type: obligation
    @id: 600
    @loc: 862:12:862:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 601
    @loc: 862:18:862:22
    @status: to be proved

    @type: obligation
    @id: 601
    @loc: 862:18:862:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 602
    @loc: 862:24:862:28
    @status: to be proved

    @type: obligation
    @id: 602
    @loc: 862:24:862:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 603
    @loc: 761:11:761:13
    @status: to be proved

    @type: obligation
    @id: 603
    @loc: 761:11:761:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 604
    @loc: 761:14:761:18
    @status: to be proved

    @type: obligation
    @id: 604
    @loc: 761:14:761:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 605
    @loc: 761:20:761:23
    @status: to be proved

    @type: obligation
    @id: 605
    @loc: 761:20:761:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 606
    @loc: 860:13:860:15
    @status: to be proved

    @type: obligation
    @id: 606
    @loc: 860:13:860:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 607
    @loc: 860:16:860:20
    @status: to be proved

    @type: obligation
    @id: 607
    @loc: 860:16:860:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 608
    @loc: 860:22:860:26
    @status: to be proved

    @type: obligation
    @id: 608
    @loc: 860:22:860:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 609
    @loc: 780:13:780:15
    @status: to be proved

    @type: obligation
    @id: 609
    @loc: 780:13:780:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 610
    @loc: 788:15:788:17
    @status: to be proved

    @type: obligation
    @id: 610
    @loc: 788:15:788:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 611
    @loc: 788:18:788:22
    @status: to be proved

    @type: obligation
    @id: 611
    @loc: 788:18:788:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 612
    @loc: 788:24:788:27
    @status: to be proved

    @type: obligation
    @id: 612
    @loc: 788:24:788:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 613
    @loc: 786:15:786:17
    @status: to be proved

    @type: obligation
    @id: 613
    @loc: 786:15:786:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 614
    @loc: 786:18:786:22
    @status: to be proved

    @type: obligation
    @id: 614
    @loc: 786:18:786:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 615
    @loc: 786:24:786:28
    @status: to be proved

    @type: obligation
    @id: 615
    @loc: 786:24:786:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 616
    @loc: 858:15:858:17
    @status: to be proved

    @type: obligation
    @id: 616
    @loc: 858:15:858:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 617
    @loc: 858:18:858:22
    @status: to be proved

    @type: obligation
    @id: 617
    @loc: 858:18:858:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 618
    @loc: 858:24:858:28
    @status: to be proved

    @type: obligation
    @id: 618
    @loc: 858:24:858:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 619
    @loc: 802:18:802:20
    @status: to be proved

    @type: obligation
    @id: 619
    @loc: 802:18:802:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 620
    @loc: 802:21:802:25
    @status: to be proved

    @type: obligation
    @id: 620
    @loc: 802:21:802:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 621
    @loc: 802:27:802:31
    @status: to be proved

    @type: obligation
    @id: 621
    @loc: 802:27:802:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 622
    @loc: 802:33:802:37
    @status: to be proved

    @type: obligation
    @id: 622
    @loc: 802:33:802:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 623
    @loc: 798:19:798:21
    @status: to be proved

    @type: obligation
    @id: 623
    @loc: 798:19:798:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 624
    @loc: 798:22:798:26
    @status: to be proved

    @type: obligation
    @id: 624
    @loc: 798:22:798:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 625
    @loc: 800:19:800:21
    @status: to be proved

    @type: obligation
    @id: 625
    @loc: 800:19:800:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 626
    @loc: 800:22:800:26
    @status: to be proved

    @type: obligation
    @id: 626
    @loc: 800:22:800:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 627
    @loc: 806:15:806:17
    @status: to be proved

    @type: obligation
    @id: 627
    @loc: 806:15:806:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 628
    @loc: 806:18:806:22
    @status: to be proved

    @type: obligation
    @id: 628
    @loc: 806:18:806:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 629
    @loc: 811:15:811:17
    @status: to be proved

    @type: obligation
    @id: 629
    @loc: 811:15:811:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 630
    @loc: 811:18:811:22
    @status: to be proved

    @type: obligation
    @id: 630
    @loc: 811:18:811:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 631
    @loc: 811:24:811:34
    @status: to be proved

    @type: obligation
    @id: 631
    @loc: 811:24:811:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 632
    @loc: 811:36:811:48
    @status: to be proved

    @type: obligation
    @id: 632
    @loc: 811:36:811:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 633
    @loc: 811:50:811:58
    @status: to be proved

    @type: obligation
    @id: 633
    @loc: 811:50:811:58
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 634
    @loc: 811:60:811:82
    @status: to be proved

    @type: obligation
    @id: 634
    @loc: 811:60:811:82
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 635
    @loc: 811:84:811:87
    @status: to be proved

    @type: obligation
    @id: 635
    @loc: 811:84:811:87
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 636
    @loc: 825:17:825:19
    @status: to be proved

    @type: obligation
    @id: 636
    @loc: 825:17:825:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 637
    @loc: 825:20:825:24
    @status: to be proved

    @type: obligation
    @id: 637
    @loc: 825:20:825:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 638
    @loc: 825:26:825:30
    @status: to be proved

    @type: obligation
    @id: 638
    @loc: 825:26:825:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 639
    @loc: 815:17:815:19
    @status: to be proved

    @type: obligation
    @id: 639
    @loc: 815:17:815:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 640
    @loc: 815:20:815:24
    @status: to be proved

    @type: obligation
    @id: 640
    @loc: 815:20:815:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 641
    @loc: 815:26:815:30
    @status: to be proved

    @type: obligation
    @id: 641
    @loc: 815:26:815:30
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 642
    @loc: 823:18:823:20
    @status: to be proved

    @type: obligation
    @id: 642
    @loc: 823:18:823:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 643
    @loc: 823:22:823:26
    @status: to be proved

    @type: obligation
    @id: 643
    @loc: 823:22:823:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 644
    @loc: 823:28:823:32
    @status: to be proved

    @type: obligation
    @id: 644
    @loc: 823:28:823:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 645
    @loc: 819:21:819:23
    @status: to be proved

    @type: obligation
    @id: 645
    @loc: 819:21:819:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 646
    @loc: 819:24:819:27
    @status: to be proved

    @type: obligation
    @id: 646
    @loc: 819:24:819:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 647
    @loc: 819:29:819:41
    @status: to be proved

    @type: obligation
    @id: 647
    @loc: 819:29:819:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 648
    @loc: 821:19:821:21
    @status: to be proved

    @type: obligation
    @id: 648
    @loc: 821:19:821:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 649
    @loc: 836:17:836:19
    @status: to be proved

    @type: obligation
    @id: 649
    @loc: 836:17:836:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 650
    @loc: 836:20:836:24
    @status: to be proved

    @type: obligation
    @id: 650
    @loc: 836:20:836:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 651
    @loc: 836:26:836:30
    @status: to be proved

    @type: obligation
    @id: 651
    @loc: 836:26:836:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 652
    @loc: 828:17:828:19
    @status: to be proved

    @type: obligation
    @id: 652
    @loc: 828:17:828:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 653
    @loc: 828:20:828:24
    @status: to be proved

    @type: obligation
    @id: 653
    @loc: 828:20:828:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 654
    @loc: 828:26:828:29
    @status: to be proved

    @type: obligation
    @id: 654
    @loc: 828:26:828:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 655
    @loc: 830:17:830:19
    @status: to be proved

    @type: obligation
    @id: 655
    @loc: 830:17:830:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 656
    @loc: 830:20:830:24
    @status: to be proved

    @type: obligation
    @id: 656
    @loc: 830:20:830:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 657
    @loc: 830:26:830:30
    @status: to be proved

    @type: obligation
    @id: 657
    @loc: 830:26:830:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 658
    @loc: 830:32:830:36
    @status: to be proved

    @type: obligation
    @id: 658
    @loc: 830:32:830:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 659
    @loc: 830:38:830:41
    @status: to be proved

    @type: obligation
    @id: 659
    @loc: 830:38:830:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 660
    @loc: 832:17:832:19
    @status: to be proved

    @type: obligation
    @id: 660
    @loc: 832:17:832:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 661
    @loc: 832:20:832:24
    @status: to be proved

    @type: obligation
    @id: 661
    @loc: 832:20:832:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 662
    @loc: 832:26:832:29
    @status: to be proved

    @type: obligation
    @id: 662
    @loc: 832:26:832:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 663
    @loc: 834:17:834:19
    @status: to be proved

    @type: obligation
    @id: 663
    @loc: 834:17:834:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 664
    @loc: 834:20:834:24
    @status: to be proved

    @type: obligation
    @id: 664
    @loc: 834:20:834:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 665
    @loc: 834:26:834:30
    @status: to be proved

    @type: obligation
    @id: 665
    @loc: 834:26:834:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 666
    @loc: 834:32:834:35
    @status: to be proved

    @type: obligation
    @id: 666
    @loc: 834:32:834:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 667
    @loc: 843:17:843:19
    @status: to be proved

    @type: obligation
    @id: 667
    @loc: 843:17:843:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 668
    @loc: 843:20:843:24
    @status: to be proved

    @type: obligation
    @id: 668
    @loc: 843:20:843:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 669
    @loc: 843:26:843:30
    @status: to be proved

    @type: obligation
    @id: 669
    @loc: 843:26:843:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 670
    @loc: 839:17:839:19
    @status: to be proved

    @type: obligation
    @id: 670
    @loc: 839:17:839:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 671
    @loc: 839:20:839:24
    @status: to be proved

    @type: obligation
    @id: 671
    @loc: 839:20:839:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 672
    @loc: 839:26:839:30
    @status: to be proved

    @type: obligation
    @id: 672
    @loc: 839:26:839:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 673
    @loc: 839:33:839:36
    @status: to be proved

    @type: obligation
    @id: 673
    @loc: 839:33:839:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 674
    @loc: 841:17:841:19
    @status: to be proved

    @type: obligation
    @id: 674
    @loc: 841:17:841:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 675
    @loc: 841:20:841:24
    @status: to be proved

    @type: obligation
    @id: 675
    @loc: 841:20:841:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 676
    @loc: 841:26:841:30
    @status: to be proved

    @type: obligation
    @id: 676
    @loc: 841:26:841:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 677
    @loc: 841:32:841:35
    @status: to be proved

    @type: obligation
    @id: 677
    @loc: 841:32:841:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 678
    @loc: 845:15:845:17
    @status: to be proved

    @type: obligation
    @id: 678
    @loc: 845:15:845:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 679
    @loc: 845:18:845:22
    @status: to be proved

    @type: obligation
    @id: 679
    @loc: 845:18:845:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 680
    @loc: 845:24:845:28
    @status: to be proved

    @type: obligation
    @id: 680
    @loc: 845:24:845:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 681
    @loc: 847:15:847:17
    @status: to be proved

    @type: obligation
    @id: 681
    @loc: 847:15:847:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 682
    @loc: 847:18:847:22
    @status: to be proved

    @type: obligation
    @id: 682
    @loc: 847:18:847:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 683
    @loc: 847:24:847:28
    @status: to be proved

    @type: obligation
    @id: 683
    @loc: 847:24:847:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 684
    @loc: 847:30:847:34
    @status: to be proved

    @type: obligation
    @id: 684
    @loc: 847:30:847:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 685
    @loc: 847:36:847:40
    @status: to be proved

    @type: obligation
    @id: 685
    @loc: 847:36:847:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 686
    @loc: 847:42:847:45
    @status: to be proved

    @type: obligation
    @id: 686
    @loc: 847:42:847:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 687
    @loc: 849:15:849:17
    @status: to be proved

    @type: obligation
    @id: 687
    @loc: 849:15:849:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 688
    @loc: 849:18:849:22
    @status: to be proved

    @type: obligation
    @id: 688
    @loc: 849:18:849:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 689
    @loc: 849:35:849:45
    @status: to be proved

    @type: obligation
    @id: 689
    @loc: 849:35:849:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 690
    @loc: 849:47:849:59
    @status: to be proved

    @type: obligation
    @id: 690
    @loc: 849:47:849:59
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 691
    @loc: 849:61:849:64
    @status: to be proved

    @type: obligation
    @id: 691
    @loc: 849:61:849:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 692
    @loc: 856:17:856:19
    @status: to be proved

    @type: obligation
    @id: 692
    @loc: 856:17:856:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 693
    @loc: 856:21:856:25
    @status: to be proved

    @type: obligation
    @id: 693
    @loc: 856:21:856:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 694
    @loc: 856:27:856:31
    @status: to be proved

    @type: obligation
    @id: 694
    @loc: 856:27:856:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 695
    @loc: 856:33:856:37
    @status: to be proved

    @type: obligation
    @id: 695
    @loc: 856:33:856:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 696
    @loc: 856:39:856:43
    @status: to be proved

    @type: obligation
    @id: 696
    @loc: 856:39:856:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 697
    @loc: 856:45:856:49
    @status: to be proved

    @type: obligation
    @id: 697
    @loc: 856:45:856:49
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 698
    @loc: 856:51:856:68
    @status: to be proved

    @type: obligation
    @id: 698
    @loc: 856:51:856:68
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 699
    @loc: 856:70:856:73
    @status: to be proved

    @type: obligation
    @id: 699
    @loc: 856:70:856:73
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 700
    @loc: 852:17:852:19
    @status: to be proved

    @type: obligation
    @id: 700
    @loc: 852:17:852:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 701
    @loc: 852:21:852:25
    @status: to be proved

    @type: obligation
    @id: 701
    @loc: 852:21:852:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 702
    @loc: 852:27:852:31
    @status: to be proved

    @type: obligation
    @id: 702
    @loc: 852:27:852:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 703
    @loc: 854:18:854:20
    @status: to be proved

    @type: obligation
    @id: 703
    @loc: 854:18:854:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 704
    @loc: 854:22:854:26
    @status: to be proved

    @type: obligation
    @id: 704
    @loc: 854:22:854:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 705
    @loc: 854:28:854:32
    @status: to be proved

    @type: obligation
    @id: 705
    @loc: 854:28:854:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 706
    @loc: 854:34:854:38
    @status: to be proved

    @type: obligation
    @id: 706
    @loc: 854:34:854:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 707
    @loc: 854:40:854:44
    @status: to be proved

    @type: obligation
    @id: 707
    @loc: 854:40:854:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 708
    @loc: 854:46:854:50
    @status: to be proved

    @type: obligation
    @id: 708
    @loc: 854:46:854:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 709
    @loc: 854:52:854:69
    @status: to be proved

    @type: obligation
    @id: 709
    @loc: 854:52:854:69
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 710
    @loc: 854:71:854:74
    @status: to be proved

    @type: obligation
    @id: 710
    @loc: 854:71:854:74
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 711
    @loc: 1032:9:1032:11
    @status: to be proved

    @type: obligation
    @id: 711
    @loc: 1032:9:1032:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 712
    @loc: 1032:12:1032:16
    @status: to be proved

    @type: obligation
    @id: 712
    @loc: 1032:12:1032:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 713
    @loc: 1032:18:1032:22
    @status: to be proved

    @type: obligation
    @id: 713
    @loc: 1032:18:1032:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 714
    @loc: 1032:24:1032:28
    @status: to be proved

    @type: obligation
    @id: 714
    @loc: 1032:24:1032:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 715
    @loc: 1032:30:1032:34
    @status: to be proved

    @type: obligation
    @id: 715
    @loc: 1032:30:1032:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 716
    @loc: 867:15:867:19
    @status: to be proved

    @type: obligation
    @id: 716
    @loc: 867:15:867:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 717
    @loc: 874:11:874:13
    @status: to be proved

    @type: obligation
    @id: 717
    @loc: 874:11:874:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 718
    @loc: 874:14:874:18
    @status: to be proved

    @type: obligation
    @id: 718
    @loc: 874:14:874:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 719
    @loc: 874:20:874:24
    @status: to be proved

    @type: obligation
    @id: 719
    @loc: 874:20:874:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 720
    @loc: 870:11:870:13
    @status: to be proved

    @type: obligation
    @id: 720
    @loc: 870:11:870:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 721
    @loc: 872:11:872:13
    @status: to be proved

    @type: obligation
    @id: 721
    @loc: 872:11:872:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 722
    @loc: 872:42:872:45
    @status: to be proved

    @type: obligation
    @id: 722
    @loc: 872:42:872:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 723
    @loc: 1028:11:1028:13
    @status: to be proved

    @type: obligation
    @id: 723
    @loc: 1028:11:1028:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 724
    @loc: 1028:14:1028:18
    @status: to be proved

    @type: obligation
    @id: 724
    @loc: 1028:14:1028:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 725
    @loc: 889:11:889:13
    @status: to be proved

    @type: obligation
    @id: 725
    @loc: 889:11:889:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 726
    @loc: 1007:13:1007:15
    @status: to be proved

    @type: obligation
    @id: 726
    @loc: 1007:13:1007:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 727
    @loc: 1007:16:1007:20
    @status: to be proved

    @type: obligation
    @id: 727
    @loc: 1007:16:1007:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 728
    @loc: 1007:22:1007:26
    @status: to be proved

    @type: obligation
    @id: 728
    @loc: 1007:22:1007:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 729
    @loc: 896:13:896:15
    @status: to be proved

    @type: obligation
    @id: 729
    @loc: 896:13:896:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 731
    @loc: 904:15:904:17
    @status: to be proved

    @type: obligation
    @id: 731
    @loc: 904:15:904:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 732
    @loc: 904:18:904:22
    @status: to be proved

    @type: obligation
    @id: 732
    @loc: 904:18:904:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 733
    @loc: 904:24:904:27
    @status: to be proved

    @type: obligation
    @id: 733
    @loc: 904:24:904:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 734
    @loc: 902:15:902:17
    @status: to be proved

    @type: obligation
    @id: 734
    @loc: 902:15:902:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 735
    @loc: 902:18:902:21
    @status: to be proved

    @type: obligation
    @id: 735
    @loc: 902:18:902:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 736
    @loc: 906:13:906:15
    @status: to be proved

    @type: obligation
    @id: 736
    @loc: 906:13:906:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 737
    @loc: 906:16:906:20
    @status: to be proved

    @type: obligation
    @id: 737
    @loc: 906:16:906:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 738
    @loc: 906:22:906:25
    @status: to be proved

    @type: obligation
    @id: 738
    @loc: 906:22:906:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 739
    @loc: 908:13:908:15
    @status: to be proved

    @type: obligation
    @id: 739
    @loc: 908:13:908:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 741
    @loc: 910:13:910:15
    @status: to be proved

    @type: obligation
    @id: 741
    @loc: 910:13:910:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 742
    @loc: 931:15:931:17
    @status: to be proved

    @type: obligation
    @id: 742
    @loc: 931:15:931:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 743
    @loc: 931:18:931:22
    @status: to be proved

    @type: obligation
    @id: 743
    @loc: 931:18:931:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 744
    @loc: 931:24:931:28
    @status: to be proved

    @type: obligation
    @id: 744
    @loc: 931:24:931:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 745
    @loc: 929:17:929:19
    @status: to be proved

    @type: obligation
    @id: 745
    @loc: 929:17:929:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 746
    @loc: 929:20:929:24
    @status: to be proved

    @type: obligation
    @id: 746
    @loc: 929:20:929:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 747
    @loc: 929:26:929:30
    @status: to be proved

    @type: obligation
    @id: 747
    @loc: 929:26:929:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 748
    @loc: 915:17:915:19
    @status: to be proved

    @type: obligation
    @id: 748
    @loc: 915:17:915:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 749
    @loc: 920:19:920:21
    @status: to be proved

    @type: obligation
    @id: 749
    @loc: 920:19:920:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 750
    @loc: 920:22:920:26
    @status: to be proved

    @type: obligation
    @id: 750
    @loc: 920:22:920:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 751
    @loc: 918:19:918:21
    @status: to be proved

    @type: obligation
    @id: 751
    @loc: 918:19:918:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 752
    @loc: 927:20:927:22
    @status: to be proved

    @type: obligation
    @id: 752
    @loc: 927:20:927:22
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 753
    @loc: 927:23:927:27
    @status: to be proved

    @type: obligation
    @id: 753
    @loc: 927:23:927:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 754
    @loc: 923:20:923:22
    @status: to be proved

    @type: obligation
    @id: 754
    @loc: 923:20:923:22
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 755
    @loc: 923:23:923:27
    @status: to be proved

    @type: obligation
    @id: 755
    @loc: 923:23:923:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 756
    @loc: 923:29:923:33
    @status: to be proved

    @type: obligation
    @id: 756
    @loc: 923:29:923:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 757
    @loc: 925:20:925:22
    @status: to be proved

    @type: obligation
    @id: 757
    @loc: 925:20:925:22
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 758
    @loc: 925:23:925:27
    @status: to be proved

    @type: obligation
    @id: 758
    @loc: 925:23:925:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 759
    @loc: 925:29:925:32
    @status: to be proved

    @type: obligation
    @id: 759
    @loc: 925:29:925:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 760
    @loc: 1005:15:1005:17
    @status: to be proved

    @type: obligation
    @id: 760
    @loc: 1005:15:1005:17
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 761
    @loc: 1005:18:1005:22
    @status: to be proved

    @type: obligation
    @id: 761
    @loc: 1005:18:1005:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 762
    @loc: 1005:24:1005:28
    @status: to be proved

    @type: obligation
    @id: 762
    @loc: 1005:24:1005:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 763
    @loc: 958:17:958:19
    @status: to be proved

    @type: obligation
    @id: 763
    @loc: 958:17:958:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 764
    @loc: 958:20:958:24
    @status: to be proved

    @type: obligation
    @id: 764
    @loc: 958:20:958:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 765
    @loc: 958:26:958:30
    @status: to be proved

    @type: obligation
    @id: 765
    @loc: 958:26:958:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 766
    @loc: 958:32:958:36
    @status: to be proved

    @type: obligation
    @id: 766
    @loc: 958:32:958:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 767
    @loc: 958:38:958:41
    @status: to be proved

    @type: obligation
    @id: 767
    @loc: 958:38:958:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 768
    @loc: 939:19:939:21
    @status: to be proved

    @type: obligation
    @id: 768
    @loc: 939:19:939:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 769
    @loc: 939:22:939:25
    @status: to be proved

    @type: obligation
    @id: 769
    @loc: 939:22:939:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 770
    @loc: 937:19:937:21
    @status: to be proved

    @type: obligation
    @id: 770
    @loc: 937:19:937:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 771
    @loc: 937:22:937:25
    @status: to be proved

    @type: obligation
    @id: 771
    @loc: 937:22:937:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 772
    @loc: 941:17:941:19
    @status: to be proved

    @type: obligation
    @id: 772
    @loc: 941:17:941:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 773
    @loc: 956:19:956:26
    @status: to be proved

    @type: obligation
    @id: 773
    @loc: 956:19:956:26
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 774
    @loc: 945:19:945:21
    @status: to be proved

    @type: obligation
    @id: 774
    @loc: 945:19:945:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 775
    @loc: 952:21:952:23
    @status: to be proved

    @type: obligation
    @id: 775
    @loc: 952:21:952:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 776
    @loc: 952:24:952:28
    @status: to be proved

    @type: obligation
    @id: 776
    @loc: 952:24:952:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 777
    @loc: 952:30:952:33
    @status: to be proved

    @type: obligation
    @id: 777
    @loc: 952:30:952:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 778
    @loc: 948:21:948:23
    @status: to be proved

    @type: obligation
    @id: 778
    @loc: 948:21:948:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 779
    @loc: 948:24:948:28
    @status: to be proved

    @type: obligation
    @id: 779
    @loc: 948:24:948:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 780
    @loc: 948:30:948:33
    @status: to be proved

    @type: obligation
    @id: 780
    @loc: 948:30:948:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 781
    @loc: 950:21:950:28
    @status: to be proved

    @type: obligation
    @id: 781
    @loc: 950:21:950:28
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 782
    @loc: 954:19:954:21
    @status: to be proved

    @type: obligation
    @id: 782
    @loc: 954:19:954:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 783
    @loc: 954:22:954:26
    @status: to be proved

    @type: obligation
    @id: 783
    @loc: 954:22:954:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 784
    @loc: 954:28:954:31
    @status: to be proved

    @type: obligation
    @id: 784
    @loc: 954:28:954:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 785
    @loc: 1003:17:1003:19
    @status: to be proved

    @type: obligation
    @id: 785
    @loc: 1003:17:1003:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 786
    @loc: 1003:20:1003:24
    @status: to be proved

    @type: obligation
    @id: 786
    @loc: 1003:20:1003:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 787
    @loc: 1003:26:1003:30
    @status: to be proved

    @type: obligation
    @id: 787
    @loc: 1003:26:1003:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 788
    @loc: 961:19:961:21
    @status: to be proved

    @type: obligation
    @id: 788
    @loc: 961:19:961:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 789
    @loc: 964:17:964:19
    @status: to be proved

    @type: obligation
    @id: 789
    @loc: 964:17:964:19
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 790
    @loc: 977:19:977:21
    @status: to be proved

    @type: obligation
    @id: 790
    @loc: 977:19:977:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 791
    @loc: 977:22:977:26
    @status: to be proved

    @type: obligation
    @id: 791
    @loc: 977:22:977:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 792
    @loc: 977:28:977:32
    @status: to be proved

    @type: obligation
    @id: 792
    @loc: 977:28:977:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 793
    @loc: 977:34:977:38
    @status: to be proved

    @type: obligation
    @id: 793
    @loc: 977:34:977:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 794
    @loc: 967:19:967:21
    @status: to be proved

    @type: obligation
    @id: 794
    @loc: 967:19:967:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 795
    @loc: 967:22:967:26
    @status: to be proved

    @type: obligation
    @id: 795
    @loc: 967:22:967:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 796
    @loc: 967:28:967:32
    @status: to be proved

    @type: obligation
    @id: 796
    @loc: 967:28:967:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 797
    @loc: 969:19:969:21
    @status: to be proved

    @type: obligation
    @id: 797
    @loc: 969:19:969:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 798
    @loc: 969:22:969:26
    @status: to be proved

    @type: obligation
    @id: 798
    @loc: 969:22:969:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 799
    @loc: 971:19:971:21
    @status: to be proved

    @type: obligation
    @id: 799
    @loc: 971:19:971:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 800
    @loc: 971:22:971:26
    @status: to be proved

    @type: obligation
    @id: 800
    @loc: 971:22:971:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 801
    @loc: 971:28:971:31
    @status: to be proved

    @type: obligation
    @id: 801
    @loc: 971:28:971:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 802
    @loc: 973:20:973:22
    @status: to be proved

    @type: obligation
    @id: 802
    @loc: 973:20:973:22
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 803
    @loc: 973:23:973:27
    @status: to be proved

    @type: obligation
    @id: 803
    @loc: 973:23:973:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 804
    @loc: 973:29:973:33
    @status: to be proved

    @type: obligation
    @id: 804
    @loc: 973:29:973:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 805
    @loc: 975:19:975:21
    @status: to be proved

    @type: obligation
    @id: 805
    @loc: 975:19:975:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 806
    @loc: 975:22:975:26
    @status: to be proved

    @type: obligation
    @id: 806
    @loc: 975:22:975:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 807
    @loc: 975:28:975:32
    @status: to be proved

    @type: obligation
    @id: 807
    @loc: 975:28:975:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 808
    @loc: 1001:19:1001:21
    @status: to be proved

    @type: obligation
    @id: 808
    @loc: 1001:19:1001:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 809
    @loc: 1001:22:1001:26
    @status: to be proved

    @type: obligation
    @id: 809
    @loc: 1001:22:1001:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 810
    @loc: 1001:28:1001:32
    @status: to be proved

    @type: obligation
    @id: 810
    @loc: 1001:28:1001:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 811
    @loc: 985:21:985:23
    @status: to be proved

    @type: obligation
    @id: 811
    @loc: 985:21:985:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 812
    @loc: 985:24:985:28
    @status: to be proved

    @type: obligation
    @id: 812
    @loc: 985:24:985:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 813
    @loc: 985:30:985:34
    @status: to be proved

    @type: obligation
    @id: 813
    @loc: 985:30:985:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 814
    @loc: 985:36:985:40
    @status: to be proved

    @type: obligation
    @id: 814
    @loc: 985:36:985:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 815
    @loc: 985:42:985:45
    @status: to be proved

    @type: obligation
    @id: 815
    @loc: 985:42:985:45
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 816
    @loc: 981:21:981:23
    @status: to be proved

    @type: obligation
    @id: 816
    @loc: 981:21:981:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 817
    @loc: 981:24:981:28
    @status: to be proved

    @type: obligation
    @id: 817
    @loc: 981:24:981:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 818
    @loc: 981:30:981:34
    @status: to be proved

    @type: obligation
    @id: 818
    @loc: 981:30:981:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 819
    @loc: 981:36:981:39
    @status: to be proved

    @type: obligation
    @id: 819
    @loc: 981:36:981:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 820
    @loc: 983:21:983:23
    @status: to be proved

    @type: obligation
    @id: 820
    @loc: 983:21:983:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 821
    @loc: 983:24:983:28
    @status: to be proved

    @type: obligation
    @id: 821
    @loc: 983:24:983:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 822
    @loc: 983:30:983:34
    @status: to be proved

    @type: obligation
    @id: 822
    @loc: 983:30:983:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 823
    @loc: 999:21:999:23
    @status: to be proved

    @type: obligation
    @id: 823
    @loc: 999:21:999:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 824
    @loc: 999:25:999:29
    @status: to be proved

    @type: obligation
    @id: 824
    @loc: 999:25:999:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 825
    @loc: 999:31:999:36
    @status: to be proved

    @type: obligation
    @id: 825
    @loc: 999:31:999:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 826
    @loc: 999:38:999:43
    @status: to be proved

    @type: obligation
    @id: 826
    @loc: 999:38:999:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 827
    @loc: 999:45:999:50
    @status: to be proved

    @type: obligation
    @id: 827
    @loc: 999:45:999:50
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 828
    @loc: 989:21:989:23
    @status: to be proved

    @type: obligation
    @id: 828
    @loc: 989:21:989:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 829
    @loc: 989:24:989:28
    @status: to be proved

    @type: obligation
    @id: 829
    @loc: 989:24:989:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 830
    @loc: 989:30:989:34
    @status: to be proved

    @type: obligation
    @id: 830
    @loc: 989:30:989:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 831
    @loc: 991:21:991:23
    @status: to be proved

    @type: obligation
    @id: 831
    @loc: 991:21:991:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 832
    @loc: 991:24:991:28
    @status: to be proved

    @type: obligation
    @id: 832
    @loc: 991:24:991:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 833
    @loc: 991:30:991:34
    @status: to be proved

    @type: obligation
    @id: 833
    @loc: 991:30:991:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 834
    @loc: 993:22:993:24
    @status: to be proved

    @type: obligation
    @id: 834
    @loc: 993:22:993:24
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 835
    @loc: 993:25:993:30
    @status: to be proved

    @type: obligation
    @id: 835
    @loc: 993:25:993:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 836
    @loc: 993:32:993:44
    @status: to be proved

    @type: obligation
    @id: 836
    @loc: 993:32:993:44
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 837
    @loc: 993:46:993:49
    @status: to be proved

    @type: obligation
    @id: 837
    @loc: 993:46:993:49
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 838
    @loc: 996:21:996:23
    @status: to be proved

    @type: obligation
    @id: 838
    @loc: 996:21:996:23
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 839
    @loc: 996:24:996:28
    @status: to be proved

    @type: obligation
    @id: 839
    @loc: 996:24:996:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 840
    @loc: 996:30:996:33
    @status: to be proved

    @type: obligation
    @id: 840
    @loc: 996:30:996:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 841
    @loc: 1012:11:1012:13
    @status: to be proved

    @type: obligation
    @id: 841
    @loc: 1012:11:1012:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 842
    @loc: 1012:14:1012:18
    @status: to be proved

    @type: obligation
    @id: 842
    @loc: 1012:14:1012:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 843
    @loc: 1012:20:1012:23
    @status: to be proved

    @type: obligation
    @id: 843
    @loc: 1012:20:1012:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 844
    @loc: 1014:11:1014:13
    @status: to be proved

    @type: obligation
    @id: 844
    @loc: 1014:11:1014:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 845
    @loc: 1014:14:1014:18
    @status: to be proved

    @type: obligation
    @id: 845
    @loc: 1014:14:1014:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 846
    @loc: 1014:20:1014:23
    @status: to be proved

    @type: obligation
    @id: 846
    @loc: 1014:20:1014:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 847
    @loc: 1023:13:1023:15
    @status: to be proved

    @type: obligation
    @id: 847
    @loc: 1023:13:1023:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 848
    @loc: 1023:16:1023:20
    @status: to be proved

    @type: obligation
    @id: 848
    @loc: 1023:16:1023:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 849
    @loc: 1023:22:1023:26
    @status: to be proved

    @type: obligation
    @id: 849
    @loc: 1023:22:1023:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 850
    @loc: 1017:13:1017:15
    @status: to be proved

    @type: obligation
    @id: 850
    @loc: 1017:13:1017:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 851
    @loc: 1017:16:1017:20
    @status: to be proved

    @type: obligation
    @id: 851
    @loc: 1017:16:1017:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 852
    @loc: 1017:33:1017:43
    @status: to be proved

    @type: obligation
    @id: 852
    @loc: 1017:33:1017:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 853
    @loc: 1017:45:1017:57
    @status: to be proved

    @type: obligation
    @id: 853
    @loc: 1017:45:1017:57
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 854
    @loc: 1017:59:1017:67
    @status: to be proved

    @type: obligation
    @id: 854
    @loc: 1017:59:1017:67
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 855
    @loc: 1017:69:1017:72
    @status: to be proved

    @type: obligation
    @id: 855
    @loc: 1017:69:1017:72
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 856
    @loc: 1019:13:1019:15
    @status: to be proved

    @type: obligation
    @id: 856
    @loc: 1019:13:1019:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 857
    @loc: 1019:16:1019:20
    @status: to be proved

    @type: obligation
    @id: 857
    @loc: 1019:16:1019:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 858
    @loc: 1019:22:1019:56
    @status: to be proved

    @type: obligation
    @id: 858
    @loc: 1019:22:1019:56
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 859
    @loc: 1021:13:1021:15
    @status: to be proved

    @type: obligation
    @id: 859
    @loc: 1021:13:1021:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 860
    @loc: 1021:17:1021:21
    @status: to be proved

    @type: obligation
    @id: 860
    @loc: 1021:17:1021:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 861
    @loc: 1021:23:1021:27
    @status: to be proved

    @type: obligation
    @id: 861
    @loc: 1021:23:1021:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 862
    @loc: 1021:38:1021:41
    @status: to be proved

    @type: obligation
    @id: 862
    @loc: 1021:38:1021:41
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 863
    @loc: 1026:11:1026:13
    @status: to be proved

    @type: obligation
    @id: 863
    @loc: 1026:11:1026:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 864
    @loc: 1026:14:1026:18
    @status: to be proved

    @type: obligation
    @id: 864
    @loc: 1026:14:1026:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 865
    @loc: 1026:20:1026:24
    @status: to be proved

    @type: obligation
    @id: 865
    @loc: 1026:20:1026:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 866
    @loc: 1026:26:1026:30
    @status: to be proved

    @type: obligation
    @id: 866
    @loc: 1026:26:1026:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 867
    @loc: 1026:32:1026:36
    @status: to be proved

    @type: obligation
    @id: 867
    @loc: 1026:32:1026:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 868
    @loc: 1026:38:1026:42
    @status: to be proved

    @type: obligation
    @id: 868
    @loc: 1026:38:1026:42
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 869
    @loc: 1026:44:1026:47
    @status: to be proved

    @type: obligation
    @id: 869
    @loc: 1026:44:1026:47
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 870
    @loc: 1030:9:1030:11
    @status: to be proved

    @type: obligation
    @id: 870
    @loc: 1030:9:1030:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 871
    @loc: 1030:12:1030:16
    @status: to be proved

    @type: obligation
    @id: 871
    @loc: 1030:12:1030:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 872
    @loc: 1061:3:1061:5
    @status: to be proved

    @type: obligation
    @id: 872
    @loc: 1061:3:1061:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 873
    @loc: 1061:6:1061:10
    @status: to be proved

    @type: obligation
    @id: 873
    @loc: 1061:6:1061:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 874
    @loc: 1061:12:1061:15
    @status: to be proved

    @type: obligation
    @id: 874
    @loc: 1061:12:1061:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 875
    @loc: 1051:3:1051:10
    @status: to be proved

    @type: obligation
    @id: 875
    @loc: 1051:3:1051:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 876
    @loc: 1053:3:1053:5
    @status: to be proved

    @type: obligation
    @id: 876
    @loc: 1053:3:1053:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 877
    @loc: 1055:3:1055:5
    @status: to be proved

    @type: obligation
    @id: 877
    @loc: 1055:3:1055:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 878
    @loc: 1059:2:1059:4
    @status: to be proved

    @type: obligation
    @id: 878
    @loc: 1059:2:1059:4
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 879
    @loc: 1059:5:1059:15
    @status: to be proved

    @type: obligation
    @id: 879
    @loc: 1059:5:1059:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 880
    @loc: 1059:17:1059:29
    @status: to be proved

    @type: obligation
    @id: 880
    @loc: 1059:17:1059:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 881
    @loc: 1059:31:1059:39
    @status: to be proved

    @type: obligation
    @id: 881
    @loc: 1059:31:1059:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 882
    @loc: 1059:41:1059:59
    @status: to be proved

    @type: obligation
    @id: 882
    @loc: 1059:41:1059:59
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 883
    @loc: 1059:61:1059:64
    @status: to be proved

    @type: obligation
    @id: 883
    @loc: 1059:61:1059:64
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 884
    @loc: 1083:1:1083:3
    @status: to be proved

    @type: obligation
    @id: 884
    @loc: 1083:1:1083:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 885
    @loc: 1206:3:1206:5
    @status: to be proved

    @type: obligation
    @id: 885
    @loc: 1206:3:1206:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 886
    @loc: 1206:6:1206:10
    @status: to be proved

    @type: obligation
    @id: 886
    @loc: 1206:6:1206:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 887
    @loc: 1206:12:1206:16
    @status: to be proved

    @type: obligation
    @id: 887
    @loc: 1206:12:1206:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 888
    @loc: 1206:18:1206:22
    @status: to be proved

    @type: obligation
    @id: 888
    @loc: 1206:18:1206:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 889
    @loc: 1088:3:1088:10
    @status: to be proved

    @type: obligation
    @id: 889
    @loc: 1088:3:1088:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 890
    @loc: 1090:3:1090:5
    @status: to be proved

    @type: obligation
    @id: 890
    @loc: 1090:3:1090:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 891
    @loc: 1090:6:1090:10
    @status: to be proved

    @type: obligation
    @id: 891
    @loc: 1090:6:1090:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 892
    @loc: 1090:12:1090:15
    @status: to be proved

    @type: obligation
    @id: 892
    @loc: 1090:12:1090:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 893
    @loc: 1187:5:1187:7
    @status: to be proved

    @type: obligation
    @id: 893
    @loc: 1187:5:1187:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 894
    @loc: 1187:8:1187:12
    @status: to be proved

    @type: obligation
    @id: 894
    @loc: 1187:8:1187:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 895
    @loc: 1187:14:1187:18
    @status: to be proved

    @type: obligation
    @id: 895
    @loc: 1187:14:1187:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 896
    @loc: 1187:20:1187:24
    @status: to be proved

    @type: obligation
    @id: 896
    @loc: 1187:20:1187:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 897
    @loc: 1094:5:1094:7
    @status: to be proved

    @type: obligation
    @id: 897
    @loc: 1094:5:1094:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 898
    @loc: 1094:8:1094:12
    @status: to be proved

    @type: obligation
    @id: 898
    @loc: 1094:8:1094:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 899
    @loc: 1116:7:1116:9
    @status: to be proved

    @type: obligation
    @id: 899
    @loc: 1116:7:1116:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 900
    @loc: 1108:8:1108:10
    @status: to be proved

    @type: obligation
    @id: 900
    @loc: 1108:8:1108:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 901
    @loc: 1108:11:1108:15
    @status: to be proved

    @type: obligation
    @id: 901
    @loc: 1108:11:1108:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 902
    @loc: 1111:7:1111:9
    @status: to be proved

    @type: obligation
    @id: 902
    @loc: 1111:7:1111:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 903
    @loc: 1114:7:1114:9
    @status: to be proved

    @type: obligation
    @id: 903
    @loc: 1114:7:1114:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 904
    @loc: 1185:7:1185:9
    @status: to be proved

    @type: obligation
    @id: 904
    @loc: 1185:7:1185:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 905
    @loc: 1185:11:1185:15
    @status: to be proved

    @type: obligation
    @id: 905
    @loc: 1185:11:1185:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 906
    @loc: 1185:17:1185:21
    @status: to be proved

    @type: obligation
    @id: 906
    @loc: 1185:17:1185:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 907
    @loc: 1185:23:1185:27
    @status: to be proved

    @type: obligation
    @id: 907
    @loc: 1185:23:1185:27
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 908
    @loc: 1185:29:1185:33
    @status: to be proved

    @type: obligation
    @id: 908
    @loc: 1185:29:1185:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 909
    @loc: 1127:9:1127:11
    @status: to be proved

    @type: obligation
    @id: 909
    @loc: 1127:9:1127:11
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 910
    @loc: 1129:7:1129:9
    @status: to be proved

    @type: obligation
    @id: 910
    @loc: 1129:7:1129:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 911
    @loc: 1129:10:1129:14
    @status: to be proved

    @type: obligation
    @id: 911
    @loc: 1129:10:1129:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 912
    @loc: 1129:16:1129:19
    @status: to be proved

    @type: obligation
    @id: 912
    @loc: 1129:16:1129:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 913
    @loc: 1170:9:1170:11
    @status: to be proved

    @type: obligation
    @id: 913
    @loc: 1170:9:1170:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 914
    @loc: 1170:12:1170:16
    @status: to be proved

    @type: obligation
    @id: 914
    @loc: 1170:12:1170:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 915
    @loc: 1170:18:1170:22
    @status: to be proved

    @type: obligation
    @id: 915
    @loc: 1170:18:1170:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 916
    @loc: 1170:24:1170:28
    @status: to be proved

    @type: obligation
    @id: 916
    @loc: 1170:24:1170:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 917
    @loc: 1143:9:1143:11
    @status: to be proved

    @type: obligation
    @id: 917
    @loc: 1143:9:1143:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 918
    @loc: 1143:12:1143:16
    @status: to be proved

    @type: obligation
    @id: 918
    @loc: 1143:12:1143:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 919
    @loc: 1145:9:1145:11
    @status: to be proved

    @type: obligation
    @id: 919
    @loc: 1145:9:1145:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 920
    @loc: 1147:9:1147:11
    @status: to be proved

    @type: obligation
    @id: 920
    @loc: 1147:9:1147:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 921
    @loc: 1168:11:1168:13
    @status: to be proved

    @type: obligation
    @id: 921
    @loc: 1168:11:1168:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 922
    @loc: 1168:14:1168:18
    @status: to be proved

    @type: obligation
    @id: 922
    @loc: 1168:14:1168:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 923
    @loc: 1168:20:1168:24
    @status: to be proved

    @type: obligation
    @id: 923
    @loc: 1168:20:1168:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 924
    @loc: 1155:11:1155:13
    @status: to be proved

    @type: obligation
    @id: 924
    @loc: 1155:11:1155:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 925
    @loc: 1155:14:1155:24
    @status: to be proved

    @type: obligation
    @id: 925
    @loc: 1155:14:1155:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 926
    @loc: 1155:26:1155:38
    @status: to be proved

    @type: obligation
    @id: 926
    @loc: 1155:26:1155:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 927
    @loc: 1155:40:1155:48
    @status: to be proved

    @type: obligation
    @id: 927
    @loc: 1155:40:1155:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 928
    @loc: 1155:50:1155:53
    @status: to be proved

    @type: obligation
    @id: 928
    @loc: 1155:50:1155:53
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 929
    @loc: 1158:11:1158:13
    @status: to be proved

    @type: obligation
    @id: 929
    @loc: 1158:11:1158:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 930
    @loc: 1158:14:1158:18
    @status: to be proved

    @type: obligation
    @id: 930
    @loc: 1158:14:1158:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 931
    @loc: 1158:20:1158:24
    @status: to be proved

    @type: obligation
    @id: 931
    @loc: 1158:20:1158:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 932
    @loc: 1158:26:1158:48
    @status: to be proved

    @type: obligation
    @id: 932
    @loc: 1158:26:1158:48
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 933
    @loc: 1158:50:1158:53
    @status: to be proved

    @type: obligation
    @id: 933
    @loc: 1158:50:1158:53
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 934
    @loc: 1160:11:1160:13
    @status: to be proved

    @type: obligation
    @id: 934
    @loc: 1160:11:1160:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 935
    @loc: 1160:15:1160:19
    @status: to be proved

    @type: obligation
    @id: 935
    @loc: 1160:15:1160:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 936
    @loc: 1160:21:1160:25
    @status: to be proved

    @type: obligation
    @id: 936
    @loc: 1160:21:1160:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 937
    @loc: 1160:27:1160:46
    @status: to be proved

    @type: obligation
    @id: 937
    @loc: 1160:27:1160:46
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 938
    @loc: 1160:49:1160:52
    @status: to be proved

    @type: obligation
    @id: 938
    @loc: 1160:49:1160:52
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 939
    @loc: 1166:13:1166:15
    @status: to be proved

    @type: obligation
    @id: 939
    @loc: 1166:13:1166:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 940
    @loc: 1166:16:1166:20
    @status: to be proved

    @type: obligation
    @id: 940
    @loc: 1166:16:1166:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 941
    @loc: 1166:22:1166:26
    @status: to be proved

    @type: obligation
    @id: 941
    @loc: 1166:22:1166:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 942
    @loc: 1166:28:1166:32
    @status: to be proved

    @type: obligation
    @id: 942
    @loc: 1166:28:1166:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 943
    @loc: 1166:34:1166:37
    @status: to be proved

    @type: obligation
    @id: 943
    @loc: 1166:34:1166:37
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 944
    @loc: 1164:14:1164:16
    @status: to be proved

    @type: obligation
    @id: 944
    @loc: 1164:14:1164:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 945
    @loc: 1164:17:1164:21
    @status: to be proved

    @type: obligation
    @id: 945
    @loc: 1164:17:1164:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 946
    @loc: 1164:23:1164:26
    @status: to be proved

    @type: obligation
    @id: 946
    @loc: 1164:23:1164:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 947
    @loc: 1183:9:1183:11
    @status: to be proved

    @type: obligation
    @id: 947
    @loc: 1183:9:1183:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 948
    @loc: 1183:12:1183:15
    @status: to be proved

    @type: obligation
    @id: 948
    @loc: 1183:12:1183:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 949
    @loc: 1174:9:1174:11
    @status: to be proved

    @type: obligation
    @id: 949
    @loc: 1174:9:1174:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 950
    @loc: 1178:9:1178:16
    @status: to be proved

    @type: obligation
    @id: 950
    @loc: 1178:9:1178:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 951
    @loc: 1181:9:1181:11
    @status: to be proved

    @type: obligation
    @id: 951
    @loc: 1181:9:1181:11
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 952
    @loc: 1181:12:1181:16
    @status: to be proved

    @type: obligation
    @id: 952
    @loc: 1181:12:1181:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 953
    @loc: 1204:5:1204:7
    @status: to be proved

    @type: obligation
    @id: 953
    @loc: 1204:5:1204:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 954
    @loc: 1204:8:1204:12
    @status: to be proved

    @type: obligation
    @id: 954
    @loc: 1204:8:1204:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 955
    @loc: 1204:14:1204:18
    @status: to be proved

    @type: obligation
    @id: 955
    @loc: 1204:14:1204:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 956
    @loc: 1198:6:1198:8
    @status: to be proved

    @type: obligation
    @id: 956
    @loc: 1198:6:1198:8
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 957
    @loc: 1194:7:1194:9
    @status: to be proved

    @type: obligation
    @id: 957
    @loc: 1194:7:1194:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 958
    @loc: 1194:10:1194:14
    @status: to be proved

    @type: obligation
    @id: 958
    @loc: 1194:10:1194:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 959
    @loc: 1196:7:1196:9
    @status: to be proved

    @type: obligation
    @id: 959
    @loc: 1196:7:1196:9
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 960
    @loc: 1200:5:1200:7
    @status: to be proved

    @type: obligation
    @id: 960
    @loc: 1200:5:1200:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 961
    @loc: 1200:8:1200:12
    @status: to be proved

    @type: obligation
    @id: 961
    @loc: 1200:8:1200:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 962
    @loc: 1200:14:1200:17
    @status: to be proved

    @type: obligation
    @id: 962
    @loc: 1200:14:1200:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 963
    @loc: 1202:5:1202:7
    @status: to be proved

    @type: obligation
    @id: 963
    @loc: 1202:5:1202:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 964
    @loc: 1202:8:1202:12
    @status: to be proved

    @type: obligation
    @id: 964
    @loc: 1202:8:1202:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 965
    @loc: 1202:14:1202:17
    @status: to be proved

    @type: obligation
    @id: 965
    @loc: 1202:14:1202:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 946

    Missing proof at File "./GFX_test.tla", line 224, character 57
    Omitted proof at File "./GFX_test.tla", line 186, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 198, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 201, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 205, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 208, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 213, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 218, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 221, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 233, characters 7-13
    Omitted proof at File "./GFX_test.tla", line 1042, characters 78-84
    Omitted proof at File "./GFX_test.tla", line 1214, characters 78-84
    File "./GFX_test.tla", line 11, character 1 to line 1215, character 77:
    [ERROR]: Proof incomplete in module "GFX_test": 1 missing, 11 omitted proof step(s).
    File "./GFX_test.tla", line 11, character 1 to line 1215, character 77:
    [INFO]: All 946 obligations proved.
---*)
