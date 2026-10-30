// The standard modules of SANY's tla2sany/StandardModules (tla2tools.jar 2026.10.28), verbatim,
// since the XML that SANY exports locates every node of them and keeps their comments.
export const SANY_STANDARD_MODULES = new Map([
  [
    "Bags",
    `----------------------------- MODULE Bags --------------------------------
(**************************************************************************)
(* A bag, also called a multiset, is a set that can contain multiple      *)
(* copies of the same element.  A bag can have infinitely many elements,  *)
(* but only finitely many copies of any single element.                   *)
(*                                                                        *)
(* We represent a bag in the usual way as a function whose range is a     *)
(* subset of the positive integers.  An element e belongs to bag B iff e  *)
(* is in the domain of B, in which case bag B contains B[e] copies of e.  *)
(**************************************************************************)
(**************************************************************************)
(* All these definitions other than SubBag are overridden by TLC in the   *)
(* Java class tlc2.module.Bags. Each operator is overridden by the Java   *)
(* method with the same name, except that the mapping for TLA+ infix      *)
(* operators is defined in the static block at the beginning of the Java  *)
(* class.                                                                 *)
(**************************************************************************)
LOCAL INSTANCE Naturals

IsABag(B) == 
  (************************************************************************)
  (* True iff B is a bag.                                                 *)
  (************************************************************************)
  B \\in [DOMAIN B -> {n \\in Nat : n > 0}]

BagToSet(B) == DOMAIN B
  (************************************************************************)
  (* The set of elements at least one copy of which is in B.              *)
  (************************************************************************)

SetToBag(S) == [e \\in S |-> 1]
  (************************************************************************)
  (* The bag that contains one copy of every element of the set S.        *)
  (************************************************************************)
  
BagIn(e,B) == e \\in BagToSet(B)
  (************************************************************************)
  (* The \\in operator for bags.                                           *)
  (************************************************************************)

EmptyBag == SetToBag({})

B1 (+) B2  ==
  (************************************************************************)
  (* The union of bags B1 and B2.                                         *)
  (************************************************************************)
  [e \\in (DOMAIN B1) \\cup (DOMAIN B2) |->
      (IF e \\in DOMAIN B1 THEN B1[e] ELSE 0) 
    + (IF e \\in DOMAIN B2 THEN B2[e] ELSE 0) ]
  
B1 (-) B2  ==
  (************************************************************************)
  (* The bag B1 with the elements of B2 removed--that is, with one copy   *)
  (* of an element removed from B1 for each copy of the same element in   *)
  (* B2.  If B2 has at least as many copies of e as B1, then B1 (-) B2    *)
  (* has no copies of e.                                                  *)
  (************************************************************************)
  LET B == [e \\in DOMAIN B1 |-> IF e \\in DOMAIN B2 THEN B1[e] - B2[e]
                                                   ELSE B1[e]]
  IN  [e \\in {d \\in DOMAIN B : B[d] > 0} |-> B[e]]

LOCAL Sum(f) ==
        (******************************************************************)
        (* The sum of f[x] for all x in DOMAIN f.  The definition assumes *)
        (* that f is a Nat-valued function and that f[x] equals 0 for all *)
        (* but a finite number of elements x in DOMAIN f.                 *)
        (******************************************************************)
        LET DSum[S \\in SUBSET DOMAIN f] ==
               LET elt == CHOOSE e \\in S : TRUE
               IN  IF S = {} THEN 0
                             ELSE f[elt] + DSum[S \\ {elt}]
        IN  DSum[DOMAIN f]

BagUnion(S) ==
  (************************************************************************)
  (* The bag union of all elements of the set S of bags.                  *)
  (************************************************************************)
  [e \\in UNION {BagToSet(B) : B \\in S} |->
    Sum( [B \\in S |-> IF BagIn(e, B) THEN B[e] ELSE 0] ) ]

B1 \\sqsubseteq B2  ==
  (************************************************************************)
  (* The subset operator for bags.  B1 \\sqsubseteq B2 iff, for all e, bag *)
  (* B2 has at least as many copies of e as bag B1 does.                  *)
  (************************************************************************)
  /\\ (DOMAIN B1) \\subseteq (DOMAIN B2)
  /\\ \\A e \\in DOMAIN B1 : B1[e] \\leq B2[e]

SubBag(B) ==
  (************************************************************************)
  (* The set of all subbags of bag B.                                     *)
  (*                                                                      *)
  (* The following definition is not the one described in the TLA+ book,  *)
  (* but rather one that TLC can evaluate.                                *)
  (************************************************************************)

  LET RemoveFromDom(x, f) == [y \\in (DOMAIN f) \\ {x} |-> f[y]]
      Combine(x, BagSet) == 
         BagSet \\cup
          {[y \\in (DOMAIN f) \\cup {x} |-> IF y = x THEN i ELSE f[y]] :
                f \\in BagSet, i \\in 1..B[x]}
      Biggest == LET Range == {B[x] : x \\in DOMAIN B}
                 IN  IF Range = {} THEN 0
                                   ELSE CHOOSE r \\in Range :
                                           \\A s \\in Range : r \\geq s
      RSB[BB \\in UNION {[S -> 1..Biggest] : S \\in SUBSET DOMAIN B}] ==
        IF BB = << >> THEN {<< >>}
                      ELSE LET x == CHOOSE x \\in DOMAIN BB : TRUE
                           IN  Combine(x, RSB[RemoveFromDom(x, BB)])
  IN RSB[B]

  (*******************  Here is the definition from the TLA+ book. ********
  LET AllBagsOfSubset == 
        (******************************************************************)
        (* The set of all bags SB such that BagToSet(SB) \\subseteq        *)
        (* BagToSet(B).                                                   *)
        (******************************************************************)
        UNION {[SB -> {n \\in Nat : n > 0}] : SB \\in SUBSET BagToSet(B)}  
  IN  {SB \\in AllBagsOfSubset : \\A e \\in DOMAIN SB : SB[e] \\leq B[e]}
  ***************************************************************************)

BagOfAll(F(_), B) ==
  (************************************************************************)
  (* The bag analog of the set {F(x) : x \\in B} for a set B. It's the bag *)
  (* that contains, for each element e of B, one copy of F(e) for every   *)
  (* copy of e in B. This defines a bag iff, for any value v, the set of  *)
  (* e in B such that F(e) = v is finite.                                 *)
  (************************************************************************)
  [e \\in {F(d) : d \\in BagToSet(B)} |-> 
     Sum( [d \\in BagToSet(B) |-> IF F(d) = e THEN B[d] ELSE 0] ) ]

BagCardinality(B) ==
  (************************************************************************)
  (* If B is a finite bag (one such that BagToSet(B) is a finite set),    *)
  (* then this is its cardinality (the total number of copies of elements *)
  (* in B).  Its value is unspecified if B is infinite.                   *)
  (************************************************************************)
  Sum(B)

CopiesIn(e, B) ==
  (************************************************************************)
  (* If B is a bag, then CopiesIn(e, B) is the number of copies of e in   *)
  (* B. If ~BagIn(e, B), then CopiesIn(e, B) = 0.                         *)
  (************************************************************************)
  IF BagIn(e, B) THEN B[e] ELSE 0
=============================================================================

(* Last modified on Fri 26 Jan 2007 at  8:45:03 PST by lamport *)

 6 Apr 99 : Modified version for standard module set
 7 Dec 98 : Corrected error found by Stephan Merz.
 6 Dec 98 : Modified comments based on suggestions by Lyle Ramshaw.
 5 Dec 98 : Initial version.
`,
  ],
  [
    "FiniteSets",
    `---------------------------- MODULE FiniteSets -----------------------------
(***************************************************************************)
(* The two definitions in this standard module are overridden by TLC in    *)
(* the Java class tlc2.module.FiniteSets.  Each operator is overridden by  *)
(* the Java method with the same name.                                     *)
(***************************************************************************)
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
  (*************************************************************************)
  (* Imports the definitions from Naturals and Sequences, but doesn't      *)
  (* export them.                                                          *)
  (*************************************************************************)

IsFiniteSet(S) == 
  (*************************************************************************)
  (* A set S is finite iff there is a finite sequence containing all its   *)
  (* elements.                                                             *)
  (*************************************************************************)
  \\E seq \\in Seq(S) : \\A s \\in S : \\E n \\in 1..Len(seq) : seq[n] = s

Cardinality(S) ==
  (*************************************************************************)
  (* Cardinality is defined only for finite sets.                          *)
  (*************************************************************************)
  LET CS[T \\in SUBSET S] == IF T = {} THEN 0
                                      ELSE 1 + CS[T \\ {CHOOSE x : x \\in T}]
  IN  CS[S]
=============================================================================
`,
  ],
  [
    "Integers",
    `-------------------------------- MODULE Integers ----------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Integers module.  It is expected that any tool will *)
(* provide its own implementations of these operators.  See the book       *)
(* "Specifying Systems" for the real Integers module.                      *)
(***************************************************************************)
(***************************************************************************)
(* The two definitions here and the definitions imported from the Naturals *)
(* module are overridden by TLC in the Java class tlc2.module.Integers.    *)
(* Each operator is overridden by the Java method with the same name,      *)
(* except that the mappings for the prefix - operator and the TLA+ infix   *)
(* operators are defined in the static block at the beginning of the Java  *)
(* class.                                                                  *)
(***************************************************************************)
EXTENDS Naturals

Int  ==  { }
(***************************************************************************)
(* This defines the prefix - operator.                                     *)
(***************************************************************************)
-. a == 0 - a
=============================================================================
`,
  ],
  [
    "Json",
    `-------------------------------- MODULE Json --------------------------------

LOCAL INSTANCE Sequences
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE TLC
  (*************************************************************************)
  (* Imports the definitions from the modules, but doesn't export them.    *)
  (*************************************************************************)

-----------------------------------------------------------------------------

LOCAL IsSequence(F, D) == TRUE \\/ FALSE

LOCAL ToJsonKeyValue(F, d) ==
  ToString(ToString(d)) \\o ":" \\o ToString(F[d])

RECURSIVE ToJsonObjectString(_,_)
LOCAL ToJsonObjectString(F, D) == \\* LOCAL just a hint for humans.
  LET d == CHOOSE d \\in D: TRUE
  IN IF D = DOMAIN F
     THEN "{" \\o ToJsonKeyValue(F, d) \\o IF D \\ {d} = {}
                                         THEN "}"
                                         ELSE ToJsonObjectString(F, D \\ {d})
     ELSE ", " \\o ToJsonKeyValue(F, d) \\o IF D \\ {d} = {}
                                          THEN "}"
                                          ELSE ToJsonObjectString(F, D \\ {d})

RECURSIVE ToJsonArrayString(_,_)
LOCAL ToJsonArrayString(F, D) == \\* LOCAL just a hint for humans.
  LET d == CHOOSE d \\in D: TRUE
  IN IF D = DOMAIN F
     THEN "[" \\o ToString(F[d]) \\o IF D \\ {d} = {}
                                   THEN "]"
                                   ELSE ToJsonArrayString(F, D \\ {d})
     ELSE ", " \\o ToString(F[d]) \\o IF D \\ {d} = {}
                                    THEN "]"
                                    ELSE ToJsonArrayString(F, D \\ {d})

RECURSIVE ToJsonString(_,_)
LOCAL ToJsonString(F, D) == \\* LOCAL just a hint for humans.
  IF IsFiniteSet(F) \\/ IsSequence(F, D) THEN
    ToJsonArrayString(F, D)
  ELSE
    ToJsonObjectString(F, D)

ToJson(value) ==
  (*************************************************************************)
  (* Converts the given value to a JSON string. Records are converted to   *)
  (* JSON objects, tuples to JSON arrays, and scalar values as their JSON  *)
  (* representation.                                                       *)
  (*************************************************************************)
  IF DOMAIN value = {} THEN
    "{}"
  ELSE
    ToJsonString(value, DOMAIN value)

ToJsonArray(value) ==
  (*************************************************************************)
  (* Converts the given tuple value to a JSON array.                       *)
  (*************************************************************************)
  IF DOMAIN value = {} THEN
    "[]"
  ELSE
    ToJsonArrayString(value, DOMAIN value)

ToJsonObject(value) ==
  (*************************************************************************)
  (* Converts the given tuple value to a JSON object.                      *)
  (*************************************************************************)
  IF DOMAIN value = {} THEN
    "{}"
  ELSE
    ToJsonObjectString(value, DOMAIN value)

JsonSerialize(absoluteFilename, value) ==
  (*************************************************************************)
  (* Serializes a tuple of values to the given file as (plain) JSON.       *)
  (* Records will be serialized as a JSON objects, and tuples as arrays.   *)
  (*************************************************************************)
  TRUE

JsonDeserialize(absoluteFilename) ==
  (*************************************************************************)
  (* Deserializes JSON values from the given file. JSON objects will be    *)
  (* deserialized to records, and arrays will be deserialized to tuples.   *)
  (*************************************************************************)
  CHOOSE val : TRUE

ndJsonSerialize(absoluteFilename, value) ==
  (*************************************************************************)
  (* Serializes a tuple of values to the given file as newline delimited   *)
  (* JSON. Records will be serialized as a JSON objects, and tuples as     *)
  (* arrays.                                                               *)
  (*************************************************************************)
  TRUE

ndJsonDeserialize(absoluteFilename) ==
  (*************************************************************************)
  (* Deserializes JSON values from the given file. JSON values must be     *)
  (* separated by newlines. JSON objects will be deserialized to records,  *)
  (* and arrays will be deserialized to tuples.                            *)
  (*************************************************************************)
  CHOOSE val : TRUE

=============================================================================
`,
  ],
  [
    "Naturals",
    `-------------------------------- MODULE Naturals ----------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Naturals module.  It is expected that any tool will *)
(* provide its own implementations of these operators.  See the book       *)
(* "Specifying Systems" for the real Naturals module.                      *)
(***************************************************************************)
(***************************************************************************)
(* These definitions are all overridden by TLC in the Java class           *)
(* tlc2.module.Naturals. Each operator is overridden by the Java method    *)
(* with the same name, except that the mapping for TLA+ infix operators    *)
(* is defined in the static block at the beginning of the Java class.      *)
(***************************************************************************)
Nat       == { }
a+b       == {a, b}

a-b       == CHOOSE n : b + n = a
a*b       == TRUE
a^b       == {a, b}
a<b       ==  a = b
a>b       ==  a = b
a \\leq b  ==  a = b
a \\geq b  ==  a = b
(***************************************************************************)
(* a .. b  is defined to equal  {i \\in Int : (a \\leq i) /\\ (i \\leq b)}     *)
(* where  Int  is the set of all integers.                                 *)
(*                                                                         *)
(* a % b  and  a \\div b  are defined so that for any integers  a  and  b   *)
(* with  b > 0 , the following formula is true:                            *)
(*                                                                         *)
(*    a  =  b * (a \\div b) + (a % b)                                       *)
(***************************************************************************)
a % b     ==  {a, b}
a \\div b  ==  {a, b}
a .. b    ==  {a, b}
=============================================================================
`,
  ],
  [
    "Randomization",
    `-------------------------- MODULE Randomization------------------------------
(***************************************************************************)
(* This module defines operators for choosing pseudo-random subsets of a   *)
(* set.  It is useful for inductive invariance checking, where the         *)
(* operators appear only in the initial predicate.  However, it may have   *)
(* other uses.                                                             *)
(*                                                                         *)
(* In breadth-first search model checking, the pseudo-random choices made  *)
(* when computing possible steps satisfying the next-state relation are    *)
(* determined by the first state of the step.  Thus, the choices made for  *)
(* a particular state will be the same in successive runs of TLC.  This is *)
(* done to permit TLC to generate an error trace if an error is found.     *)
(* This applies only when TLC is run in breadth-first search mode.  In     *)
(* particular, the choices made in simulation mode are independent of the  *)
(* state for which they are made.                                          *)
(***************************************************************************)

(***************************************************************************)
(* Except for TestRandomSetOfSubsets, all these definitions are overridden *)
(* by TLC in the Java class tlc2.module.Randomization.  Each operator is   *)
(* overridden by the Java method with the same name.                       *)
(***************************************************************************)
LOCAL INSTANCE Naturals
LOCAL INSTANCE FiniteSets

(***************************************************************************)
(* RandomSubset(k, S) equals a randomly chosen subset of S containing k    *)
(* elements, where 0 < k < Cardinality(S).                                 *)
(***************************************************************************)
RandomSubset(k, S) == CHOOSE T \\in SUBSET S : Cardinality(T) = k

(***************************************************************************)
(* RandomSetOfSubsets(k, n, S) equals a pseudo-randomly chosen set of      *)
(* subsets of S -- that is, a randomly chosen subset of SUBSET S .  Thus,  *)
(* each element T of this set is a subset of S.  Each such T is chosen so  *)
(* that each element of S has a probability n / Cardinality(S) of being in *)
(* T.  Thus, the average number of elements in each chosen subset T is n.  *)
(* The set RandomSetOfSubsets(k, n, S) is obtained by making k such        *)
(* choices of T .  Because this can produce duplicate choices, the number  *)
(* of elements T in this set may be less than k.  The average number of    *)
(* elements in RandomSetOfSubsets(k, n, S) seems to be difficult to        *)
(* compute in general.  However, there is very little variation in the     *)
(* actual number of elements in the chosen set for fixed values of k, n,   *)
(* and Cardinality(S).  You can therefore use the operator                 *)
(* TestRandomSetOfSubsets defined below to find out approximately how      *)
(* close to k the cardinality of the chosen set of subsets is.             *)
(***************************************************************************)
RandomSetOfSubsets(k, n, S) == CHOOSE T \\in SUBSET SUBSET S :
                                              Cardinality(T) \\leq k

(***************************************************************************)
(* The value of TestRandomSetOfSubsets(k, n, S) is a sequence of five      *)
(* values that are the cardinality of the set of subsets produced by five  *)
(* executions of RandomSetOfSubsets(k, n, S).  For constant values of k,   *)
(* n, and S, you can enter TestRandomSetOfSubsets(k, n, S) in the Evaluate *)
(* Constant Expression section of a TLC model in the TLA+ Toolbox.         *)
(* Running TLC will then tell you the approximate number of elements in    *)
(* the set of subsets produced by RandomSetOfSubsets for these parameters. *)
(* You can then choose k to obtain a set of the desired size.              *)
(***************************************************************************)
TestRandomSetOfSubsets(k, n, S) ==
              [i \\in 1..5 |-> Cardinality(RandomSetOfSubsets(k, n, S))]

=============================================================================
`,
  ],
  [
    "RealTime",
    `----------------------------- MODULE RealTime -------------------------------
(***************************************************************************)
(* This standard module is described in Chapter 9 of the book "Specifying  *)
(* Systems".  The type of specification described there cannot be handled  *)
(* by the TLC model checker.                                               *)
(***************************************************************************)
EXTENDS Reals 
VARIABLE now

RTBound(A, v, D, E) == 
  LET TNext(t)  ==  t' = IF <<A>>_v \\/ ~(ENABLED <<A>>_v)'
                           THEN 0 
                           ELSE t + (now'-now)

      Timer(t) == (t=0)  /\\  [][TNext(t)]_<<t, v, now>>

      MaxTime(t) == [](t \\leq E) 

      MinTime(t) == [][A => t \\geq D]_v 
  IN \\EE t : Timer(t) /\\ MaxTime(t) /\\ MinTime(t)
-----------------------------------------------------------------------------
RTnow(v) == LET NowNext == /\\ now' \\in {r \\in Real : r > now} 
                           /\\ UNCHANGED v
            IN  /\\ now \\in Real 
                /\\ [][NowNext]_now
                /\\ \\A r \\in Real : WF_now(NowNext /\\ (now'>r))
=============================================================================
`,
  ],
  [
    "Reals",
    `-------------------------------- MODULE Reals -------------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Reals module.  It is expected that any tool that    *)
(* handles specifications that use real numbers will provide its own       *)
(* implementations of these operators.  TLC currently does not handle real *)
(* numbers and produces an error if a specification requires TLC to        *)
(* evaluate the operators defined here or to evaluate any operator defined *)
(* in the Integers module that is applied to non-integer real numbers.     *)
(*                                                                         *)
(* See the book "Specifying Systems" for the real Reals module.            *)
(***************************************************************************)
EXTENDS Integers

Real  == "Reals"
a / b == CHOOSE m \\in Real : m * b = a
Infinity == CHOOSE i : (i \\notin Real) /\\ (\\A r \\in Real : i > r)
=============================================================================
`,
  ],
  [
    "Sequences",
    `------------------------------ MODULE Sequences -----------------------------
(***************************************************************************)
(* Defines operators on finite sequences, where a sequence of length n is  *)
(* represented as a function whose domain is the set 1..n (the set         *)
(* {1, 2, ... , n}).  This is also how TLA+ defines an n-tuple, so         *)
(* tuples are sequences.                                                   *)
(***************************************************************************)
(***************************************************************************)
(* These definitions are all overridden by TLC in the Java class           *)
(* tlc2.module.Sequences. Each operator is overridden by the Java method   *)
(* with the same name, except that the mapping for TLA+ infix operators    *)
(* is defined in the static block at the beginning of the Java class.      *)
(***************************************************************************)

LOCAL INSTANCE Naturals
  (*************************************************************************)
  (* Imports the definitions from Naturals, but doesn't export them.       *)
  (*************************************************************************)
  
Seq(S) == UNION {[1..n -> S] : n \\in Nat}
  (*************************************************************************)
  (* The set of all sequences of elements in S.                            *)
  (*************************************************************************)

Len(s) == CHOOSE n \\in Nat : DOMAIN s = 1..n
  (*************************************************************************)
  (* The length of sequence s.                                             *)
  (*************************************************************************)

s \\o t == [i \\in 1..(Len(s) + Len(t)) |-> IF i \\leq Len(s) THEN s[i]
                                                           ELSE t[i-Len(s)]]
  (*************************************************************************)
  (* The sequence obtained by concatenating sequences s and t.             *)
  (*************************************************************************)

Append(s, e) == s \\o <<e>>
  (**************************************************************************)
  (* The sequence obtained by appending element e to the end of sequence s. *)
  (**************************************************************************)

Head(s) == s[1]
Tail(s) == CASE s # << >> -> [i \\in 1..(Len(s)-1) |-> s[i+1]]
  (*************************************************************************)
  (* The usual head (first) and tail (rest) operators. (Definition of Tail *)
  (* changed on 4 Jun 2013 because original defined Tail(<< >>) = << >> .  *)
  (*************************************************************************)

SubSeq(s, m, n) == [i \\in 1..(1+n-m) |-> s[i+m-1]]
  (*************************************************************************)
  (* The sequence <<s[m], s[m+1], ... , s[n]>>.                            *)
  (*************************************************************************)
  
SelectSeq(s, Test(_)) == 
  (*************************************************************************)
  (* The subsequence of s consisting of all elements s[i] such that        *)
  (* Test(s[i]) is true.                                                   *)
  (*************************************************************************)
  LET F[i \\in 0..Len(s)] == 
        (*******************************************************************)
        (* F[i] equals SelectSeq(SubSeq(s, 1, i), Test) .                  *)
        (*******************************************************************)
        IF i = 0 THEN << >>
                 ELSE IF Test(s[i]) THEN Append(F[i-1], s[i])
                                    ELSE F[i-1]
  IN F[Len(s)]
=============================================================================
`,
  ],
  [
    "TLC",
    `------------------------------- MODULE TLC ----------------------------------
(***************************************************************************)
(* This is a standard module for use with the TLC model checker.           *)
(* Operators not explained by comments here are explained in the book      *)
(* "Specifying Systems".                                                   *)
(*                                                                         *)
(* The definitions of all the operators in this module are overridden by   *)
(* TLC with methods defined in the Java class tlc2.module.TLC.  Each       *)
(* definition is overridden with the method of the same name, except that  *)
(* the mapping from infix operators to Java methods is specified in the    *)
(* static block at the beginning of the Java class.                        *)
(***************************************************************************)
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
LOCAL INSTANCE FiniteSets
-----------------------------------------------------------------------------
Print(out, val) == val
PrintT(out) == TRUE
   (************************************************************************)
   (* This expression equals TRUE, but evaluating it causes TLC to print   *)
   (* the value of out.                                                    *)
   (************************************************************************)
   
Assert(val, out) == IF val = TRUE THEN TRUE
                                  ELSE CHOOSE v : TRUE
JavaTime == CHOOSE n : n \\in Nat

(***************************************************************************)
(* TLC can read and set a special list of values while evaluating          *)
(* expressions using the operators TLCSet and TLCGet.  When TLC evaluates  *)
(* TLCSet(i,v), for any positive integer i and arbitrary value v, it       *)
(* obtains the value TRUE and sets element number i of the list to v.      *)
(* When TLC evaluates TLCGet(i), the value it obtains is the current value *)
(* of the element number i of this list.                                   *)
(*                                                                         *)
(* One use of this feature is to check TLC's progress during long          *)
(* computations.  For example, suppose TLC is evaluating a formula         *)
(* \\A x \\in S : P where S is a large set, so it evaluates P many times.    *)
(* You can use TLCGet, TLCSet, and Print to print something after every    *)
(* 1000 times TLC evaluates P.                                             *)
(*                                                                         *)
(* As explained in the description of the TLCEval operator below, you may  *)
(* also want to use this feature to count how many times TLC is evaluating *)
(* an expression e.  To use value number i as the counter, just replace e  *)
(* by                                                                      *)
(*                                                                         *)
(*   IF TLCSet(i, TLCGet(i)+1) THEN e ELSE 42                              *)
(*                                                                         *)
(* (The ELSE expression is never evaluated.)                               *)
(*                                                                         *)
(* TLCGet accepts some pre-defined string values to query TLC state. The   *)
(* values are as follows:                                                  *)
(*                                                                         *)
(*   - TLCGet("distinct") evaluates to the total number of distinct states *)
(*     found by TLC so far, globally.                                      *)
(*   - TLCGet("queue") evaluates to the number of states currently in the  *)
(*     queue to be checked.                                                *)
(*   - TLCGet("duration") evaluates to the number of seconds elapsed since *)
(*     model checking began.                                               *)
(*   - TLCGet("diameter") evaluates to the length of the longest behavior  *)
(*     found by TLC so far, globally (equals one in the initial predicate).*)
(*   - TLCGet("level") is the length of the current behavior (equals zero  *)
(*     in the evaluation of the initial predicate).                        *)
(*                                                                         *)
(* For reasons of efficiency, TLCGet and TLCSet behave somewhat strangely  *)
(* when TLC is run with multiple worker threads.  Each worker thread       *)
(* maintains its own individual copy of the list of values on which it     *)
(* evaluates TLCGet and TLCSet.  The worker threads are activated only     *)
(* after the computation and invariance checking of the initial states.    *)
(* Before then, evaluating TLCSet(i,v) sets the element i of the list      *)
(* maintained by all threads.  Thus, the lists of all the worker threads   *)
(* can be initialized by putting the appropriate TLCSet expression in an   *)
(* ASSUME expression or in the initial predicate.                          *)
(***************************************************************************)
TLCGet(i) == CHOOSE n : TRUE
TLCSet(i, v) == TRUE
-----------------------------------------------------------------------------
d :> e == [x \\in {d} |-> e]
f @@ g == [x \\in (DOMAIN f) \\cup (DOMAIN g) |->
            IF x \\in DOMAIN f THEN f[x] ELSE g[x]]
Permutations(S) == 
   {f \\in [S -> S] : \\A w \\in S : \\E v \\in S : f[v]=w}
-----------------------------------------------------------------------------
(***************************************************************************)
(* In the following definition, we use Op as the formal parameter rather   *)
(* than \\prec because TLC Version 1 can't handle infix formal parameters.  *)
(***************************************************************************)
SortSeq(s, Op(_, _)) ==
    LET Perm == CHOOSE p \\in Permutations(1 .. Len(s)) :
                  \\A i, j \\in 1..Len(s) : 
                     (i < j) => Op(s[p[i]], s[p[j]]) \\/ (s[p[i]] = s[p[j]])
    IN  [i \\in 1..Len(s) |-> s[Perm[i]]]

(***************************************************************************)
(* TLC evaluates RandomElement(S) to be a pseudo-randomly chosen element   *)
(* of the set S, where each element of S is chosen with equal probability. *)
(* This feature was added to enable the computation of statistical         *)
(* properties of a specification's executions by running TLC in simulation *)
(* mode.  We don't know if anyone has ever done this.                      *)
(*                                                                         *)
(* In breadth-first search model checking, the pseudo-random choices made  *)
(* when computing possible steps satisfying the next-state relation are    *)
(* determined by the first state of the step.  Thus, the choices made for  *)
(* a particular state will be the same in successive runs of TLC.  This is *)
(* done to permit TLC to generate an error trace if an error is found.     *)
(* This applies only when TLC is run in breadth-first search mode.  The    *)
(* random choices made in simulation mode are independent of the state for *)
(* which they are made.                                                    *)
(***************************************************************************)
RandomElement(s) == CHOOSE x \\in s : TRUE

(***************************************************************************)
(* The constant value Any has the special property that, for any value v,  *)
(* TLC evaluates the expression  v \\in Any  to equal TRUE.  The special    *)
(* value Any was introduced because TLA+ originally allowed only functions *)
(* to be defined recursively, and it was sometimes convenient to define a  *)
(* function with domain Any.  It is retained for backwards compatibility.  *)
(***************************************************************************)
Any == CHOOSE x : TRUE

ToString(v) == (CHOOSE x \\in [a : v, b : STRING] : TRUE).b
   (************************************************************************)
   (* This equals a string that is the TLA+ representation of the value    *)
   (* that TLC obtains by evaluating v.                                    *)
   (************************************************************************)

(***************************************************************************)
(* TLC often uses lazy evaluation.  For example, it may not enumerate the  *)
(* elements of a set of the form {x \\in T : P(x)} unless it has to; and it *)
(* doesn't have to if it only needs to check if an element e is in that    *)
(* set.  (TLC can do that by evaluating x \\in T and P(e).) TLC uses        *)
(* heuristics to determine when it should completely evaluate an           *)
(* expression.  Those heuristics work well most of the time.  However,     *)
(* sometimes lazy evaluation can result in the expression ultimately being *)
(* evaluated multiple times instead of just once.  This can especially be  *)
(* a problem when evaluating a recursively defined operator.  You can get  *)
(* TLC to fully evaluate an expression exp and not use lazy evaluation by  *)
(* replacing exp with TLCEval(exp).                                        *)
(*                                                                         *)
(* If TLC is taking a long time to evaluate something, you can check if    *)
(* lazy evaluation is the source of the problem by using the TLCSet and    *)
(* TLCGet operators to count how many times expressions are being          *)
(* evaluated.                                                              *)
(***************************************************************************)
TLCEval(v) == v

=============================================================================`,
  ],
  [
    "TLCExt",
    `------------------------------- MODULE TLCExt -------------------------------

LOCAL INSTANCE TLC
LOCAL INSTANCE Integers
  (*************************************************************************)
  (* Imports the definitions from the modules, but doesn't export them.    *)
  (*************************************************************************)

-----------------------------------------------------------------------------

\\* AssertEq(a, b) is logically equivalent to the expression 'a = b'. If a and b are not equal, 
\\* however, AssertEq(a, b) will print out the values of 'a' and 'b'. If the two values are equal,
\\* nothing will be printed.
AssertEq(a, b) == 
    IF a # b THEN
        /\\ PrintT("Assertion failed")
        /\\ PrintT(a)
        /\\ PrintT(b)
        /\\ a = b
    ELSE a = b


AssertError(err, exp) ==
    LET FailsEval(e) == CHOOSE b \\in BOOLEAN : TRUE \\* Expression failed to evaluate. 
        TLCError     == CHOOSE s \\in STRING  : TRUE \\* TLC error string.
    IN IF FailsEval(exp) THEN Assert(err = TLCError, TLCError) ELSE TRUE

-----------------------------------------------------------------------------

TLCGetOrDefault(key, defaultVal) ==
  CHOOSE n : TRUE

TLCGetAndSet(key, Op(_,_), val, defaultVal) ==
  LET oldVal == TLCGetOrDefault(key, defaultVal)
  IN CHOOSE v \\in {oldVal} : TLCSet(key, Op(oldVal, val))

-----------------------------------------------------------------------------

(* HERE BE DRAGONS! The operators below are experimental! You will probably not need them! *)

Trace == 
  (******************************************************************************)
  (* The sequence of states (represented as a record whose DOMAIN is the set of *)
  (* a spec's variables) from an initial state to the current state.  In other  *)
  (* words, a prefix - of a behavior - ending with the current state.  A way to *)
  (* think about this operator is to see it as an implicit history variable     *)
  (* that does not have to be explicitly specified at the level of the spec.    *)
  (*                                                                            *)
  (* Note that op is incompatible with TLC!RandomElement and Randomization (see *)
  (* tlc2.tool.TLCTrace.getTrace(LongVec)) and will cause TLC to crash.  This   *)
  (* technical limitation could be removed though.                              *)
  (*                                                                            *)
  (* Beware that Trace is prohibitively expensive when evaluated as part of     *)
  (* the next-state relation, invariants, properties, or any constraint in      *)
  (* model-checking mode. Consider using a real history variable instead.       *)
  (******************************************************************************)
  TRUE \\* TODO

-----------------------------------------------------------------------------

CounterExample ==
    (****************************************************************************)
    (* In the scope of POSTCONDITION, the operator CounterExample is equivalent *)
    (* to a (directed) graph represented as [state: States, action: Actions]    *)
    (* with                                                                     *)
    (*   States \\subseteq [ Variables -> Values ]                               *)
    (* and                                                                      *)
    (*  Actions \\subseteq                                                       *)
    (*            (CounterExample.state \\X Action \\X CounterExample.state).     *)
    (* If TLC found no violations, then CounterExample.states equals {} and     *)
    (* CounterExample.actions equals {}.  If only initial state violates a      *)
    (* (safety) property, CounterExample.state is a set of those states, and    *)
    (* CounterExample.actions = {}.                                             *)
    (****************************************************************************)
    TRUE

ToTrace(CE) ==
	(* 
	This definition is implemented by the TLCExt#toTrace Java module override. It
	is commented because FiniteSetsExt is part of the CommunityModules, but not
	tla2tools.

	LET F == INSTANCE FiniteSetsExt
	IN F!FoldSet(LAMBDA a, acc: acc @@ [n \\in {a[1]} |-> a[2]], [n \\in {} |-> n], CounterExample.state)

	*)
	TRUE 

-----------------------------------------------------------------------------

TLCModelValue(str) ==
  (******************************************************************************)
  (* A model value is an unspecified value that TLC considers to be unequal to  *)
  (* any value that you can express in TLA+.                                    *)
  (*                                                                            *)
  (* In most cases, TLC model values can and should be declared via the TLC     *)
  (* config file.  However, for large sets of model values, it can become       *)
  (* tedious to enumerate them explicitly. Large sets of model values usually   *)
  (* appear when simulating TLA+ specs with TLC. The following example defines  *)
  (* a set of 32 model values:                                                  *)
  (*                                                                            *)
  (*  SetOfModelValues == {TLCModelValue("T_MV" \\o ToString(i)) : i \\in 1..32}  *)
  (*                                                                            *)
  (* As a matter of fact, the example defines a set of "typed" model values:    *)
  (* TLC considers a typed model value to be unequal to any other model value   *)
  (* of the same type.  However, it produces an error when evaluating an        *)
  (* expression requires it to determine if a typed model value is equal to any *)
  (* value other than a model value of the same type or an ordinary model       *)
  (* value.                                                                     *)
  (*                                                                            *)
  (* A model-value type consists of a single letter, so there are 52 different  *)
  (* types because  a  and  A  are different types.  (TLC actually accepts      *)
  (* digits and underscore as types; don't use them.)  A model value has type   *)
  (* T  if and only if its name begins with the two characters  T_ .            *)
  (*                                                                            *)
  (* TLCModelValue may only appear in constant definitions!  Expect bogus       *)
  (* behavior if TLCModelValue appears in the behavior spec, constraints,       *)
  (* invariants, or properties.                                                 *)
  (******************************************************************************)
  CHOOSE v: ToString(v) = str

TLCDefer(expression) ==
  (******************************************************************************)
  (* Defer evaluation of expression to some later time or never.                *)
  (*                                                                            *)
  (* For TLC's simulation mode, later is defined as the point of time when      *)
  (* simulation has chosen a successor state to extend the prefix of the        *)
  (* current behavior.                                                          *)
  (*                                                                            *)
  (* A use case is TLCDefer(TLCSet(42, someVal)), which sets someVal only       *)
  (* for the states of the behavior and not the set of all successor states     *)
  (* of all states in the behavior.                                             *)
  (******************************************************************************)
  TRUE

-----------------------------------------------------------------------------

TLCNoOp(val) ==
  (******************************************************************************)
  (* No-operation operator (does nothing).  Only useful to debug TLC's          *)
  (* evaluator that is written in Java: Insert TLCNoOp into the expression      *)
  (* whose evaluation you wish to debug and set a breakpoint in this            *)
  (* operator's Java module override TLCExt#tlcNoOp in TLCExt.java.             *)
  (******************************************************************************)
  val


PickSuccessor(exp) ==
  (******************************************************************************)
  (* When set as an action constraint in the configuration file, interactively  *)
  (* pick successor states during state exploration, iff the expression exp     *)
  (* evaluates to FALSE.  To always pick successor states manually, use         *)
  (* PickSuccessor(FALSE). To pick successor states when the current prefix of  *)
  (* behaviors exceeds 22 states, use PickSuccessor(TLCGet("level") < 23).      *)
  (* Evaluates to TRUE when evaluated in the context of a constant- or          *)
  (* state-level formula.  Also evaluates to TRUE if PickSuccessor appears as   *)
  (* part of the next-state relation and the successor state has not been       *)
  (* fully determined yet.                                                      *)
  (******************************************************************************)
  IF (exp)
  THEN TRUE
  ELSE CHOOSE bool \\in BOOLEAN : TRUE 

-----------------------------------------------------------------------------

TLCCache(expression, closure) ==
  (******************************************************************************)
  (* Equals the value that an earlier evaluation of the expression evaluated to *)
  (* iff the closure of the earlier evaluation and this evaluation are equal.   *)
  (*                                                                            *)
  (* Works in constant and state-level contexts.                                *)
  (******************************************************************************)
  expression

TLCFP(var) ==
  (******************************************************************************)
  (* Equals the value that TLC gives to the given input when the value is       *)
  (* being fingerprinted.                                                       *)
  (* Implementation note: Equals the lower 32 bits until TLC supports longs     *)
  (******************************************************************************)
  CHOOSE i \\in Int: TRUE

-----------------------------------------------------------------------------

TLCEvalDefinition(definitionName) ==
  (******************************************************************************)
  (* Equals the value of the definition with the given name.                    *)
  (* Throws an error if the definition cannot be found.                         *)
  (******************************************************************************)
  TRUE \\* TODO

============================================================================
`,
  ],
  [
    "Toolbox",
    `----------------------------- MODULE Toolbox --------------------------------
(***************************************************************************)
(*                                                                         *)
(***************************************************************************)
LOCAL INSTANCE Naturals   \\* a + b
LOCAL INSTANCE FiniteSets \\* Cardinality
LOCAL INSTANCE TLC        \\* TLCGet

-----------------------------------------------------------------------------

(* Trace Exploration *)

_TETrace ==
    CHOOSE f \\in [ (Nat \\ {0}) -> STRING ] : TRUE

LOCAL _TETraceLength == Cardinality(DOMAIN _TETrace)

\\* When evaluated as part of a TLC ALIAS expression, \`_TEPosition\` should be
\\* redefined as \`TLCGet("level"), or replace with \`TLCGet(level)\` right away.
\\* The definition below accounts for several "peculiarities" of the
\\* Toolbox's trace exploration.
_TEPosition == 
    IF TLCGet("level") >= _TETraceLength
       THEN _TETraceLength
       ELSE IF TLCGet("level") = 0 THEN 1 ELSE TLCGet("level")

=============================================================================
`,
  ],
  [
    "_DotTrace",
    `------------------------------- MODULE _DotTrace -------------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE GraphViz
LOCAL INSTANCE IOUtils
LOCAL INSTANCE Sequences
LOCAL INSTANCE Functions

CONSTANT _DotTraceFile

_DotTrace ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ LET N == CounterExample.state
               E == { <<e[1], e[3], e[2]>> : e \\in CounterExample.action }
               G == [node |-> N, edge |-> E] IN
           Serialize(DotDiGraph(G, LAMBDA v: FoldFunctionOnSet(
           								LAMBDA x, y: ToString(x) \\o "\\n" \\o y, "", v[2], DOMAIN v[2]), 
           						   LAMBDA e: e[3].name),
    			_DotTraceFile,
    			[
    				format |-> "TXT",
    				charset |-> "UTF-8",
    				openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>
    			]
           ).exitValue = 0
        /\\ PrintT("CounterExample written: " \\o _DotTraceFile)

=============================================================================
`,
  ],
  [
    "_JsonTrace",
    `------------------------------- MODULE _JsonTrace -------------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Json
LOCAL INSTANCE Sequences
LOCAL INSTANCE Naturals

CONSTANT _JsonTraceFile

_JsonTrace ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ LET trace == ToTrace(CounterExample)
               vars  == UNION { DOMAIN trace[i] : i \\in DOMAIN trace }
           IN JsonSerialize(_JsonTraceFile, [counterexample |-> CounterExample, vars |-> vars])
        /\\ PrintT("CounterExample written: " \\o _JsonTraceFile)

----------------------------------------------------------------------------
\\* Deserialize a trace created by _JsonTrace above.

CONSTANT _JsonTraceInputFile   \\* Used by -loadTrace json

\\* This operator has a Java module override (tlc2.module._JsonTrace#tlcState).
LOCAL _TLCState(level) ==
	Trace[level]

LOCAL _JsonTraceDump == JsonDeserialize(_JsonTraceInputFile)

\\* A liveness counterexample's action graph contains a closing edge that
\\* completes the lasso. In a forward path s1->s2->...->sn every edge
\\* satisfies target[1] > source[1]; the closing edge is the unique edge
\\* where target[1] <= source[1] (back-to-state: <, stuttering: =).
LOCAL _JsonTraceLassoTarget ==
    LET actions == _JsonTraceDump["counterexample"]["action"]
    IN IF \\E i \\in DOMAIN actions : actions[i][3][1] <= actions[i][1][1]
       THEN LET i == CHOOSE i \\in DOMAIN actions :
                        actions[i][3][1] <= actions[i][1][1]
            IN actions[i][3][1]
       ELSE 0

LOCAL _JsonTraceConstraint ==
    LET level == TLCGet("level")
        \\* DOMAIN trace is meaningful only because we serialize TLA+ sets as JSON arrays. JSON has
        \\* no set type---only the world's favorite least-common-denominator of strings, numbers,
        \\* and nested lists---so on the wire every set is an ordered sequence. If that encoding
        \\* ever changed (or JSON miraculously grew a real set type), indexing states by DOMAIN
        \\* would stop matching what we dump.
        \\* Rebuilding vars likewise assumes the array order matches TLC's normalized set order from
        \\* when the trace was written; the format does not pin down a stronger invariant.
        trace == _JsonTraceDump["counterexample"]["state"]
        \\* JSON deserializes sets as tuples, so convert back to a set
        vars  == {_JsonTraceDump["vars"][i] : i \\in DOMAIN _JsonTraceDump["vars"]}
	\\* For liveness properties, TLC trace dumps stop at the state *before* the
	\\* lasso is closed. When replaying such a trace, TLC may request a state with
	\\*   level = Len(trace) + 1,
	\\* which does not exist in the dump. In that case, the constraint
	\\* is intentionally vacuously satisfied.
	\\* Since the names of the spec's variables are not known, Trace[level] is
	\\* used as a generic reference to the variables of the current state.
    IN level \\in DOMAIN trace =>
            \\* When loading a trace with a subset of variables, only check the variables
            \\* that exist in both the trace and the current state. This allows trace 
            \\* replay with specs that have different variable sets than the original spec
            \\* that produced the trace. Another scenario is when the spec uses ALIAS
            \\* to rename, add, or remove variables.
            \\A v \\in vars \\cap (DOMAIN _TLCState(level)):
                    _TLCState(level)[v] = trace[level][2][v]

\\* VIEW for trace replay. Includes TLCGet("level") to prevent premature
\\* state collapsing within the trace. For liveness traces, the level
\\* beyond the trace is mapped to the lasso target so the cycle can close.
LOCAL _JsonTraceView ==
    LET level       == TLCGet("level")
        traceLen    == Len(_JsonTraceDump["counterexample"]["state"])
        lassoTarget == _JsonTraceLassoTarget
    IN IF level <= traceLen
       THEN << level, _TLCState(level) >>
       ELSE << lassoTarget, _TLCState(level) >>

=============================================================================
`,
  ],
  [
    "_Possible",
    `------------------------------ MODULE _Possible ------------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences

LOCAL _Update(Op(_,_), val) ==
    TLCSet("s:_possible", Op(TLCGetOrDefault("s:_possible", <<>>), val))

_Track(expr, name) ==
    _Update(LAMBDA old, b:
        IF b
        THEN
            IF name \\in DOMAIN old
            THEN [old EXCEPT ![name] = @ + 1]
            ELSE old @@ (name :> 1)
        ELSE old @@ (name :> 0), expr)

LOCAL _Merge(a, b) ==
    [name \\in (DOMAIN a) \\cup (DOMAIN b) |->
        (IF name \\in DOMAIN a THEN a[name] ELSE 0) +
        (IF name \\in DOMAIN b THEN b[name] ELSE 0)]

_Counts == \\* Java override for efficiency
    LET workers == TLCGet("all:named")["s:_possible"]
        n == Len(workers)
        Fold[i \\in 0..n] ==
            IF i = 0 THEN <<>>
            ELSE _Merge(Fold[i-1], workers[i])
    IN Fold[n]

_CheckName(name) ==
    LET counts == _Counts
    IN (name \\notin DOMAIN counts \\/ counts[name] = 0)
       => (PrintT(counts) /\\ FALSE)

_PrintCounts == PrintT(_Counts)

=============================================================================
`,
  ],
  [
    "_TLAPlusCounterExample",
    `----------------------- MODULE _TLAPlusCounterExample ------------------------
LOCAL INSTANCE IOUtils
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Sequences
LOCAL INSTANCE SequencesExt

CONSTANT _TLAPlusCounterExampleFile

LOCAL _TLAPlusCounterExampleModule ==
	LET ModuleName == ReplaceFirstSubSeq("", ".tla", _TLAPlusCounterExampleFile) IN
	"---- MODULE " \\o ModuleName \\o " ----\\n" \\o
    "LOCAL INSTANCE TLC\\n\\n" \\o
    "CounterExample == \\n\\t" \\o
    ToString(CounterExample) \\o 
    "\\n\\n===="

_TLAPlusCounterExample ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ Serialize(_TLAPlusCounterExampleModule,
    			_TLAPlusCounterExampleFile,
    			[
    				format |-> "TXT",
    				charset |-> "UTF-8",
    				openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>
    			]
           ).exitValue = 0
        /\\ PrintT("CounterExample written: " \\o _TLAPlusCounterExampleFile)

=============================================================================
`,
  ],
  [
    "_TLCActionTrace",
    `------- MODULE _TLCActionTrace ------
LOCAL INSTANCE IOUtils
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Sequences
LOCAL INSTANCE SequencesExt
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE FiniteSetsExt

LOCAL _extends ==
    LET M == FoldSet(LAMBDA a, acc: acc \\cup {a[2].location.module}, {}, CounterExample.action)
    IN FoldSet(LAMBDA module, acc: acc \\o (IF acc = "" THEN "EXTENDS " ELSE ", ") \\o module, "", M)

LOCAL _next ==
    LET Params(r) == FoldLeft(LAMBDA acc, p: acc \\o (IF acc = "" THEN "" ELSE ", ") \\o ToString(r.context[p]), 
                              "", r.parameters)
        Signature(r) == IF "parameters" \\in DOMAIN r THEN r.name \\o "(" \\o Params(r) \\o ")" ELSE r.name
        ToDisjunct(i, r) == "\\\\/ " \\o ToString(i) \\o " = _idx /\\\\ " \\o Signature(r) \\o "\\n"
    IN FoldSet(LAMBDA a, acc: acc \\o ToDisjunct(a[1][1], a[2]), "", CounterExample.action)

CONSTANT _TLCTraceFile

LOCAL _TLCTraceModule ==
	LET ModuleName == ReplaceFirstSubSeq("", ".tla", _TLCTraceFile) 
        L == ToString(Cardinality(CounterExample.action)) IN
	"---- MODULE " \\o ModuleName \\o " ----\\n" \\o
	 \\*TODO callsignature symbols may not be defined in the same modules where the actions are defined.
	 \\*TODO E.g., model values are typically defined in the MC file.
        _extends \\o "\\n\\n" \\o
    "_length == " \\o L \\o "\\n\\n" \\o
    "_next(_idx) ==\\n" \\o _next \\o "\\n" \\o
    "_actionConstraint ==\\n" \\o
    "_next(LET T == INSTANCE TLC IN T!TLCGet(\\"level\\"))\\n" \\o
    "\\n===="

_TLCTrace ==
    IF CounterExample.action = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ Serialize(_TLCTraceModule,
    			_TLCTraceFile,
    			[
    				format |-> "TXT",
    				charset |-> "UTF-8",
    				openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>
    			]
           ).exitValue = 0
        /\\ PrintT("CounterExample written: " \\o _TLCTraceFile)

======`,
  ],
  [
    "_TLCTESpec",
    `----------------------- MODULE _TLCTESpec ------------------------
LOCAL INSTANCE IOUtils
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Sequences
LOCAL INSTANCE SequencesExt
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE FiniteSetsExt

LOCAL _extends ==
    LET M == FoldSet(LAMBDA a, acc: acc \\cup {a[2].location.module}, {}, CounterExample.action)
    IN FoldSet(LAMBDA module, acc: acc \\o (IF acc = "" THEN "EXTENDS " ELSE ", ") \\o module, "", M)

LOCAL _Vars ==
    UNION { DOMAIN pair[2] : pair \\in CounterExample.state }

LOCAL _ToConjunt(v, prime, idx) ==
    "/\\\\ " \\o v \\o prime \\o " = Trace[" \\o idx \\o "]." \\o v \\o "\\n"

CONSTANT _TLCTraceFile

LOCAL _conjunct(prime, idx) ==
    FoldSet(LAMBDA v, acc: acc \\o _ToConjunt(v, prime, idx), "", _Vars)

LOCAL _subVars ==
    FoldSet(LAMBDA v, acc: acc \\o (IF acc = "" THEN "" ELSE ", ") \\o v, "", _Vars)

LOCAL _TLCTraceModule ==
	LET ModuleName == ReplaceFirstSubSeq("", ".tla", _TLCTraceFile) IN
	"---- MODULE " \\o ModuleName \\o " ----\\n" \\o
	 \\*TODO E.g., model values are typically defined in the MC file.
        _extends \\o "\\n\\n" \\o
    "LOCAL INSTANCE TLC\\n\\n" \\o
    "Trace == \\n\\t" \\o
	ToString(ToTrace(CounterExample)) \\o
	"\\n\\n" \\o
    "_init ==\\n" \\o _conjunct("", "1") \\o
	"\\n" \\o
    "_next ==\\n\\\\E i,j \\\\in DOMAIN Trace:\\n/\\\\ i = TLCGet(\\"level\\")\\n/\\\\ j = i + 1\\n" \\o
    _conjunct("", "i") \\o _conjunct("'", "j") \\o
    "\\n(* Allow infinite stuttering to prevent deadlock on termination. *)" \\o
    "\\n_terminating ==\\n\\tUNCHANGED <<" \\o _subVars \\o ">>" \\o 
    "\\n\\n_spec == \\n\\t_init /\\\\ [][_next \\\\/ _terminating]_<<" \\o _subVars \\o ">>\\n" \\o
    "\\n===="
    \\* TODO: Append in-file config here.

_TLCTrace ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ Serialize(_TLCTraceModule,
    			_TLCTraceFile,
    			[
    				format |-> "TXT",
    				charset |-> "UTF-8",
    				openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>
    			]
           ).exitValue = 0
        /\\ PrintT("CounterExample written: " \\o _TLCTraceFile)

=============================================================================
`,
  ],
  [
    "_TLCTrace",
    `---------------------------- MODULE _TLCTrace ----------------------------
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Sequences
LOCAL INSTANCE Naturals

\\* This operator has a Java module override (tlc2.module._TLCTrace#ioDeserialize).
LOCAL _TLCTraceDeserialize(absoluteFilename) ==
    TRUE

\\* This operator has a Java module override (tlc2.module._TLCTrace#ioSerialize).
LOCAL _TLCTraceSerialize(val, absoluteFilename) ==
    TRUE

----------------------------------------------------------------------------
\\* Serialize a trace to a file.

CONSTANT _TLCTraceFile

LOCAL _TLCTrace0(verbose) ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ LET trace == ToTrace(CounterExample)
               vars  == UNION { DOMAIN trace[i] : i \\in DOMAIN trace }
           IN _TLCTraceSerialize([counterexample |-> CounterExample, vars |-> vars], _TLCTraceFile)
        /\\ IF verbose THEN PrintT("CounterExample written: " \\o _TLCTraceFile) ELSE TRUE

LOCAL _TLCTraceSilent ==
    _TLCTrace0(FALSE)

_TLCTrace ==
    _TLCTrace0(TRUE)

----------------------------------------------------------------------------
\\* Deserialize a trace created by _TLCTrace above.

CONSTANT _TLCTraceInputFile   \\* Used by -loadTrace tlc

LOCAL _TLCTraceFileDeserialized ==
    _TLCTraceDeserialize(_TLCTraceInputFile)

\\* This operator has a Java module override (tlc2.module._TLCTrace#tlcState).
LOCAL _TLCState(level) ==
	Trace[level]

\\* A liveness counterexample's action graph contains a closing edge that
\\* completes the lasso. In a forward path s1->s2->...->sn every edge
\\* satisfies target[1] > source[1]; the closing edge is the unique edge
\\* where target[1] <= source[1] (back-to-state: <, stuttering: =).
LOCAL _TLCTraceLassoTarget ==
    LET actions == _TLCTraceFileDeserialized["counterexample"]["action"]
    IN IF \\E e \\in actions : e[3][1] <= e[1][1]
       THEN (CHOOSE e \\in actions : e[3][1] <= e[1][1])[3][1]
       ELSE 0

LOCAL _TLCTraceConstraint ==
    LET level == TLCGet("level")
        dump  == _TLCTraceFileDeserialized
        trace == dump["counterexample"]["state"]
        vars  == dump["vars"]
	\\* The trace (CounterExample.state) is a set of <<level, state>> pairs,
	\\* not a function/sequence.
	\\* For liveness properties, TLC trace dumps stop at the state *before* the
	\\* lasso is closed. When replaying such a trace, TLC may request a state with
	\\* a level that does not exist in the dump. In that case, no pair matches and
	\\* the implication is vacuously satisfied.
    IN \\A pair \\in trace:
            pair[1] = level =>
                \\* When loading a trace with a subset of variables, only check the
                \\* variables that exist in both the trace and the current state.
                \\* This allows trace replay with specs that have different variable
                \\* sets than the original spec that produced the trace. Another
                \\* scenario is when the spec uses ALIAS to rename, add, or remove
                \\* variables.
                \\A v \\in vars \\cap DOMAIN _TLCState(level):
                        _TLCState(level)[v] = pair[2][v]

\\* VIEW for trace replay. Includes TLCGet("level") to prevent premature
\\* state collapsing within the trace. For liveness traces, the level
\\* beyond the trace is mapped to the lasso target so the cycle can close.
LOCAL _TLCTraceView ==
    LET level       == TLCGet("level")
        trace       == _TLCTraceFileDeserialized["counterexample"]["state"]
        lassoTarget == _TLCTraceLassoTarget
    IN IF \\E pair \\in trace : pair[1] = level
       THEN << level, _TLCState(level) >>
       ELSE << lassoTarget, _TLCState(level) >>

=============================================================================
`,
  ],
  [
    "_TLCTracePlain",
    `----------------------- MODULE _TLCTracePlain ------------------------
LOCAL INSTANCE IOUtils
LOCAL INSTANCE TLC
LOCAL INSTANCE TLCExt
LOCAL INSTANCE Sequences
LOCAL INSTANCE SequencesExt

CONSTANT _TLCTraceFile

LOCAL _TLCTraceModule ==
	LET ModuleName == ReplaceFirstSubSeq("", ".tla", _TLCTraceFile) IN
	"---- MODULE " \\o ModuleName \\o " ----\\n" \\o
    "LOCAL INSTANCE TLC\\n\\n" \\o
    "Trace == \\n\\t" \\o
	ToString(ToTrace(CounterExample)) \\o
    "\\n\\n===="

_TLCTrace ==
    IF CounterExample.state = {} \\/ ("console" \\in DOMAIN CounterExample /\\ CounterExample["console"] = FALSE) THEN TRUE ELSE
        /\\ Serialize(_TLCTraceModule,
    			_TLCTraceFile,
    			[
    				format |-> "TXT",
    				charset |-> "UTF-8",
    				openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>
    			]
           ).exitValue = 0
        /\\ PrintT("CounterExample written: " \\o _TLCTraceFile)

=============================================================================
`,
  ],
]);
